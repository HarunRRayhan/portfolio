<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('consultation_bookings', function (Blueprint $table) {
            $table->timestamp('reschedule_original_starts_at')->nullable();
            $table->timestamp('reschedule_original_ends_at')->nullable();
            $table->string('reschedule_hold_event_id')->nullable();
            $table->timestamp('stripe_refund_attempted_at')->nullable();
            $table->string('stripe_refund_idempotency_key')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('consultation_bookings', function (Blueprint $table) {
            $table->dropColumn([
                'reschedule_original_starts_at',
                'reschedule_original_ends_at',
                'reschedule_hold_event_id',
                'stripe_refund_attempted_at',
                'stripe_refund_idempotency_key',
            ]);
        });
    }
};
