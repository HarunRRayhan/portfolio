<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('roadmap_comment_threads', function (Blueprint $table) {
            $table->id();
            $table->string('key', 200)->unique(); // "{roadmap}/{topic}" or "{roadmap}/{topic}/{lesson}"
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('roadmap_comment_threads');
    }
};
