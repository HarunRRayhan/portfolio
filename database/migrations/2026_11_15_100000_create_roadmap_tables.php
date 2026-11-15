<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('roadmap_starts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('roadmap_slug', 64);
            $table->timestamps();
            $table->unique(['user_id', 'roadmap_slug']);
        });

        Schema::create('roadmap_progress', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('roadmap_slug', 64);
            $table->string('step_id', 64);
            $table->timestamp('completed_at');
            $table->unique(['user_id', 'roadmap_slug', 'step_id']);
        });

        Schema::create('roadmap_reactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('roadmap_slug', 64);
            $table->string('type', 16);
            $table->timestamps();
            $table->unique(['user_id', 'roadmap_slug', 'type']);
            $table->index(['roadmap_slug', 'type']);
        });

        Schema::create('roadmap_access_grants', function (Blueprint $table) {
            $table->id();
            $table->string('email');
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->timestamp('expires_at');
            $table->string('note', 500)->nullable();
            $table->foreignId('granted_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('revoked_at')->nullable();
            $table->timestamps();
            $table->index('email');
        });

        Schema::table('github_sponsorships', function (Blueprint $table) {
            $table->unsignedInteger('monthly_price_cents')->nullable()->after('github_tier_node_id');
        });
    }

    public function down(): void
    {
        Schema::table('github_sponsorships', fn (Blueprint $table) => $table->dropColumn('monthly_price_cents'));
        Schema::dropIfExists('roadmap_access_grants');
        Schema::dropIfExists('roadmap_reactions');
        Schema::dropIfExists('roadmap_progress');
        Schema::dropIfExists('roadmap_starts');
    }
};
