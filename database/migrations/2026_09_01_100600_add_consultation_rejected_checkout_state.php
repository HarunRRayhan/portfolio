<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('consultation_bookings', function (Blueprint $table) {
            $table->string('stripe_checkout_rejected_session_id')->nullable()->index();
        });
    }

    public function down(): void
    {
        Schema::table('consultation_bookings', function (Blueprint $table) {
            $table->dropColumn('stripe_checkout_rejected_session_id');
        });
    }
};
