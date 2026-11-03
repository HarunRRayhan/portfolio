<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('github_sponsorships', function (Blueprint $table) {
            $table->id();
            $table->string('github_sponsor_id')->index();
            $table->string('github_login');
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('tier_slug')->nullable(); // null = donation
            $table->string('github_tier_node_id')->nullable();
            $table->string('kind', 20);
            $table->string('status', 20);
            $table->string('source', 20);
            $table->string('grant_email')->nullable();
            $table->timestamp('started_at');
            $table->timestamp('ended_at')->nullable();
            $table->string('github_sponsorship_node_id')->nullable()->unique();
            $table->timestamps();
        });

        Schema::create('consultation_credits', function (Blueprint $table) {
            $table->id();
            $table->foreignId('github_sponsorship_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('kind', 10);
            $table->foreignId('consultation_tier_id')->nullable()->constrained()->nullOnDelete();
            $table->date('period_start');
            $table->unsignedSmallInteger('slot');
            $table->timestamp('expires_at');
            $table->foreignId('used_by_booking_id')->nullable()->constrained('consultation_bookings')->nullOnDelete();
            $table->timestamp('used_at')->nullable();
            $table->string('scan_repo_url')->nullable();
            $table->timestamp('revoked_at')->nullable();
            $table->timestamp('reminded_at')->nullable();
            $table->timestamps();

            $table->unique(['github_sponsorship_id', 'kind', 'period_start', 'slot'], 'consultation_credits_period_slot_unique');
        });

        Schema::create('github_webhook_events', function (Blueprint $table) {
            $table->id();
            $table->string('delivery_id')->unique();
            $table->string('event');
            $table->string('action')->nullable();
            $table->json('payload');
            $table->timestamp('processed_at')->nullable();
            $table->timestamp('failed_at')->nullable();
            $table->text('error')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('github_webhook_events');
        Schema::dropIfExists('consultation_credits');
        Schema::dropIfExists('github_sponsorships');
    }
};
