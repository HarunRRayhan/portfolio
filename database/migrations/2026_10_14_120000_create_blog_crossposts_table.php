<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('blog_crossposts', function (Blueprint $table) {
            $table->id();
            $table->string('slug');
            $table->string('platform');
            $table->string('remote_id')->nullable();
            $table->string('remote_url')->nullable();
            $table->timestamps();
            $table->unique(['slug', 'platform']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('blog_crossposts');
    }
};
