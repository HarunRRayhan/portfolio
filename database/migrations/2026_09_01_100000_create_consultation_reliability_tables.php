<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('consultation_notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('consultation_booking_id')->nullable()->constrained()->nullOnDelete();
            $table->string('deduplication_key')->unique();
            $table->string('recipient', 320);
            $table->string('mail_type', 80);
            $table->text('payload')->nullable();
            $table->string('status', 20)->index();
            $table->unsignedInteger('attempts')->default(0);
            $table->text('last_error')->nullable();
            $table->timestamp('available_at')->nullable();
            $table->timestamp('sent_at')->nullable();
            $table->timestamps();

            $table->index(['status', 'available_at']);
        });

        Schema::create('consultation_google_operations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('consultation_booking_id')->constrained()->cascadeOnDelete();
            $table->string('operation_key')->unique();
            $table->string('operation', 50);
            $table->text('payload')->nullable();
            $table->string('status', 20)->index();
            $table->unsignedInteger('attempts')->default(0);
            $table->text('last_error')->nullable();
            $table->timestamp('available_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->index(['status', 'available_at']);
            $table->index(['consultation_booking_id', 'status']);
        });

        Schema::create('consultation_stripe_checkout_attempts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('consultation_booking_id')->constrained()->cascadeOnDelete();
            $table->string('idempotency_key')->unique();
            $table->text('access_token');
            $table->string('stripe_checkout_session_id')->nullable()->index();
            $table->string('status', 20)->index();
            $table->unsignedInteger('attempts')->default(0);
            $table->text('last_error')->nullable();
            $table->timestamp('next_attempt_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->index(['consultation_booking_id', 'status']);
            $table->index(['status', 'next_attempt_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('consultation_stripe_checkout_attempts');
        Schema::dropIfExists('consultation_google_operations');
        Schema::dropIfExists('consultation_notifications');
    }
};
