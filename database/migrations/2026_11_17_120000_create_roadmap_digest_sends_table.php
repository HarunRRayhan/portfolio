<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // One row per user per week: a rerun of the command never sends the same digest twice.
        Schema::create('roadmap_digest_sends', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('week_key', 12);
            $table->timestamp('sent_at')->useCurrent();
            $table->unique(['user_id', 'week_key']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('roadmap_digest_sends');
    }
};
