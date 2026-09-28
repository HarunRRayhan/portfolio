<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('consultation_bookings', function (Blueprint $table): void {
            $table->char('skaleagents_referral_hash', 64)->nullable()->unique();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('consultation_bookings', function (Blueprint $table): void {
            $table->dropUnique(['skaleagents_referral_hash']);
            $table->dropColumn('skaleagents_referral_hash');
        });
    }
};
