<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bio_links', function (Blueprint $table) {
            $table->string('icon')->default('link')->after('url');
        });
    }

    public function down(): void
    {
        Schema::table('bio_links', function (Blueprint $table) {
            $table->dropColumn('icon');
        });
    }
};
