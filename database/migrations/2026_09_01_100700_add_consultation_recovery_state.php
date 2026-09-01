<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('consultation_bookings', function (Blueprint $table) {
            $table->unsignedInteger('google_generation')->default(0);
            $table->text('stripe_refund_last_error')->nullable();
            $table->index(['status', 'stripe_refund_attempted_at']);
        });
    }

    public function down(): void
    {
        Schema::table('consultation_bookings', function (Blueprint $table) {
            $table->dropIndex(['status', 'stripe_refund_attempted_at']);
            $table->dropColumn(['google_generation', 'stripe_refund_last_error']);
        });
    }
};
