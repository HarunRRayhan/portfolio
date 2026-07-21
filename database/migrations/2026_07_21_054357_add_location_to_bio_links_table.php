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
        Schema::table('bio_links', function (Blueprint $table) {
            $table->json('include_countries')->nullable()->after('tab');
            $table->json('exclude_countries')->nullable()->after('include_countries');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('bio_links', function (Blueprint $table) {
            $table->dropColumn(['include_countries', 'exclude_countries']);
        });
    }
};
