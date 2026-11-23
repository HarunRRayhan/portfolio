<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    // The separate roadmap progress email is gone; its progress now rides in the weekly newsletter.
    public function up(): void
    {
        Schema::dropIfExists('roadmap_digest_sends');
    }

    public function down(): void
    {
        Schema::create('roadmap_digest_sends', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('week_key', 12);
            $table->timestamp('sent_at')->useCurrent();
            $table->unique(['user_id', 'week_key']);
        });
    }
};
