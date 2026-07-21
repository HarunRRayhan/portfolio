<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bio_links', function (Blueprint $table) {
            $table->string('tab_slug', 100)->nullable()->after('tab');
        });
    }

    public function down(): void
    {
        Schema::table('bio_links', function (Blueprint $table) {
            $table->dropColumn('tab_slug');
        });
    }
};
