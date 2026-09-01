<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('consultation_bookings', function (Blueprint $table) {
            $table->string('stripe_checkout_idempotency_key')->nullable();
            $table->string('stripe_refund_id')->nullable();
            $table->timestamp('stripe_refunded_at')->nullable();
            $table->timestamp('access_token_expires_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('consultation_bookings', function (Blueprint $table) {
            $table->dropColumn([
                'stripe_checkout_idempotency_key',
                'stripe_refund_id',
                'stripe_refunded_at',
                'access_token_expires_at',
            ]);
        });
    }
};
