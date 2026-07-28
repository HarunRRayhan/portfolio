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
        Schema::create('media_items', function (Blueprint $table) {
            $table->id();
            $table->string('type')->index();
            $table->string('title');
            $table->string('slug');
            $table->text('summary')->nullable();
            $table->string('url');
            $table->foreignId('short_link_id')->nullable()
                ->constrained('short_links')->nullOnDelete();
            $table->string('thumbnail_path')->nullable();
            $table->string('source_label')->nullable();
            $table->timestamp('published_at')->nullable();
            $table->boolean('is_active')->default(true);
            $table->unsignedSmallInteger('priority')->default(100);
            $table->timestamps();

            // Two items of different types (a slide deck and a video) may
            // share a slug -- each type gets its own /slides/{slug} or
            // /videos/{slug} namespace -- but not two of the same type.
            $table->unique(['type', 'slug']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('media_items');
    }
};
