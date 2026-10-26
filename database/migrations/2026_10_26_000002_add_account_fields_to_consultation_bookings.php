<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('consultation_bookings', function (Blueprint $table) {
            $table->foreignId('user_id')->nullable()->after('id')->constrained()->nullOnDelete();
            $table->string('website', 2048)->nullable()->after('company_name');
            $table->string('role', 120)->nullable()->after('website');
            $table->string('team_size', 40)->nullable()->after('role');
            $table->string('budget', 60)->nullable()->after('team_size');
        });
    }

    public function down(): void
    {
        Schema::table('consultation_bookings', function (Blueprint $table) {
            $table->dropConstrainedForeignId('user_id');
            $table->dropColumn(['website', 'role', 'team_size', 'budget']);
        });
    }
};
