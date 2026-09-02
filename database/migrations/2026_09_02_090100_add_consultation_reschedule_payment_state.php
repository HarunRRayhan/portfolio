<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('consultation_bookings', function (Blueprint $table) {
            $table->timestamp('reschedule_original_payment_due_at')->nullable();
            $table->timestamp('reschedule_original_access_token_expires_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('consultation_bookings', function (Blueprint $table) {
            $table->dropColumn([
                'reschedule_original_payment_due_at',
                'reschedule_original_access_token_expires_at',
            ]);
        });
    }
};
