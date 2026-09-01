<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('consultation_stripe_webhook_events', function (Blueprint $table) {
            $table->string('booking_public_id', 26)->nullable()->index();
            $table->string('stripe_checkout_session_id')->nullable()->index();
            $table->timestamp('unmatched_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('consultation_stripe_webhook_events', function (Blueprint $table) {
            $table->dropColumn([
                'booking_public_id',
                'stripe_checkout_session_id',
                'unmatched_at',
            ]);
        });
    }
};
