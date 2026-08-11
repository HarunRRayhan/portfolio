<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bio_links', function (Blueprint $table) {
            // English is the only content language today, so every existing
            // row is correctly backfilled as 'en'. A separate Bangla link set
            // will be tagged 'bn' when it ships.
            $table->string('locale', 5)->default('en')->after('label');
        });
    }

    public function down(): void
    {
        Schema::table('bio_links', function (Blueprint $table) {
            $table->dropColumn('locale');
        });
    }
};
