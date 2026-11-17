<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Schema;

// Stripe is gone for good (payments are GitHub Sponsors). Mail the old Stripe records to the owner, then drop them.
return new class extends Migration
{
    private const COLUMNS = [
        'stripe_checkout_session_id', 'stripe_payment_intent_id', 'stripe_checkout_idempotency_key',
        'stripe_refund_id', 'stripe_refunded_at', 'stripe_refund_attempted_at', 'stripe_refund_idempotency_key',
        'stripe_checkout_attempted_at', 'stripe_checkout_next_attempt_at', 'stripe_checkout_last_error',
        'stripe_paid_at', 'stripe_checkout_checked_at', 'stripe_checkout_rejected_session_id', 'stripe_refund_last_error',
    ];

    private const TABLES = ['consultation_stripe_webhook_events', 'consultation_stripe_checkout_attempts'];

    public function up(): void
    {
        $columns = array_values(array_filter(self::COLUMNS, fn ($c) => Schema::hasColumn('consultation_bookings', $c)));
        $export = [
            'consultation_bookings' => $columns === [] ? [] : DB::table('consultation_bookings')
                ->where(function ($q) use ($columns) {
                    foreach ($columns as $c) {
                        $q->orWhereNotNull($c);
                    }
                })
                ->get(['id', 'public_id', 'status', ...$columns])->all(),
        ];
        foreach (self::TABLES as $t) {
            $export[$t] = Schema::hasTable($t) ? DB::table($t)->orderBy('id')->get()->all() : [];
        }

        // A failed send throws, so nothing is dropped without a copy.
        if (array_filter($export) !== [] && config('mail.owner.address')) {
            Mail::raw('The old Stripe payment records from harun.dev are attached. The database no longer keeps them.', fn ($m) => $m
                ->to(config('mail.owner.address'), config('mail.owner.name'))
                ->subject('harun.dev: Stripe history export')
                ->attachData(json_encode($export, JSON_PRETTY_PRINT | JSON_THROW_ON_ERROR), 'stripe-history.json', ['mime' => 'application/json']));
        }

        foreach (self::TABLES as $t) {
            Schema::dropIfExists($t);
        }
        if ($columns !== []) {
            Schema::table('consultation_bookings', function (Blueprint $table) use ($columns) {
                // SQLite can't drop an indexed column, so drop the indexes first.
                foreach ([['stripe_checkout_session_id'], ['stripe_paid_at'], ['stripe_checkout_rejected_session_id'], ['status', 'stripe_refund_attempted_at']] as $index) {
                    if (array_diff($index, ['status'], $columns) === []) {
                        $table->dropIndex($index);
                    }
                }
                $table->dropColumn($columns);
            });
        }
    }

    public function down(): void
    {
        // One-way: the export email is the only copy.
    }
};
