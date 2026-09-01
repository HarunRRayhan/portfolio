<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('consultation_bookings', function (Blueprint $table) {
            $table->timestamp('stripe_checkout_attempted_at')->nullable();
            $table->timestamp('stripe_checkout_next_attempt_at')->nullable();
            $table->text('stripe_checkout_last_error')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('consultation_bookings', function (Blueprint $table) {
            $table->dropColumn([
                'stripe_checkout_attempted_at',
                'stripe_checkout_next_attempt_at',
                'stripe_checkout_last_error',
            ]);
        });
    }
};
