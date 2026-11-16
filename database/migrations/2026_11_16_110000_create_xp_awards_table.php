<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('xp_awards', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('key', 191);
            $table->unsignedSmallInteger('points');
            $table->unsignedBigInteger('comment_id')->nullable()->index();
            $table->timestamp('created_at')->index();
            $table->unique(['user_id', 'key']);
        });

        Schema::table('users', fn (Blueprint $table) => $table->boolean('leaderboard_hidden')->default(false));
    }

    public function down(): void
    {
        Schema::table('users', fn (Blueprint $table) => $table->dropColumn('leaderboard_hidden'));
        Schema::dropIfExists('xp_awards');
    }
};
