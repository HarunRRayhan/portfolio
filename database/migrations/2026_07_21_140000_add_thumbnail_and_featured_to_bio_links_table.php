<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Adds the featured-thumbnail-card feature: a stored image path plus a flag
 * for whether the link renders as the large hero card at the top of its tab
 * (Linktree-style) instead of a standard row.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bio_links', function (Blueprint $table) {
            $table->string('thumbnail_path')->nullable()->after('icon');
            $table->boolean('featured')->default(false)->after('thumbnail_path');
        });
    }

    public function down(): void
    {
        Schema::table('bio_links', function (Blueprint $table) {
            $table->dropColumn(['thumbnail_path', 'featured']);
        });
    }
};
