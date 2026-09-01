<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('consultation_bookings', function (Blueprint $table) {
            $table->timestamp('stripe_paid_at')->nullable()->index();
            $table->timestamp('stripe_checkout_checked_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('consultation_bookings', function (Blueprint $table) {
            $table->dropColumn([
                'stripe_paid_at',
                'stripe_checkout_checked_at',
            ]);
        });
    }
};
