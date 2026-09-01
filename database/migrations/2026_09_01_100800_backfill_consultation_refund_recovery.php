<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $now = now('UTC');

        /*
         * A persisted cancel_approved event is the only safe evidence that a
         * pre-recovery cancellation had entered approval. Leave ordinary
         * cancel requests untouched so the scheduler cannot approve them.
         */
        DB::table('consultation_bookings as bookings')
            ->select('bookings.id')
            ->where(function ($query) {
                $query->where('bookings.status', 'cancel_requested')
                    ->orWhere(function ($query) {
                        $query->where('bookings.status', 'cancelled')
                            ->whereNotNull('bookings.cancelled_at');
                    });
            })
            ->whereNotNull('bookings.stripe_payment_intent_id')
            ->whereNull('bookings.stripe_refund_attempted_at')
            ->whereNull('bookings.stripe_refund_id')
            ->whereNull('bookings.stripe_refunded_at')
            ->whereNull('bookings.stripe_refund_last_error')
            ->whereExists(function ($query) {
                $query->selectRaw('1')
                    ->from('consultation_booking_events as events')
                    ->whereColumn('events.consultation_booking_id', 'bookings.id')
                    ->where('events.event', 'cancel_approved');
            })
            ->orderBy('bookings.id')
            ->get()
            ->each(function ($booking) use ($now): void {
                DB::table('consultation_bookings')
                    ->where('id', $booking->id)
                    ->update([
                        'stripe_refund_attempted_at' => $now,
                        'stripe_refund_idempotency_key' => 'consultation-booking-'.$booking->id.'-refund',
                        'updated_at' => $now,
                    ]);
            });
    }

    public function down(): void
    {
        // Data backfills are intentionally not reversed.
    }
};
