<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// roadmap_slug now also holds "slug/topic" and "slug/topic/lesson", so a roadmap's total counts every page under it.
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('roadmap_views', fn (Blueprint $table) => $table->string('roadmap_slug', 200)->change());
    }

    public function down(): void
    {
        // Left wide: narrowing would fail once topic and lesson keys exist.
    }
};
