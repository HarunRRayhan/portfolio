<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('consultation_stripe_webhook_events', function (Blueprint $table) {
            $table->id();
            $table->string('event_id')->unique();
            $table->string('type', 100);
            $table->string('status', 20)->index();
            $table->unsignedInteger('attempts')->default(0);
            $table->foreignId('consultation_booking_id')->nullable()->constrained()->nullOnDelete();
            $table->text('last_error')->nullable();
            $table->timestamp('processed_at')->nullable();
            $table->timestamps();

            $table->index(['status', 'updated_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('consultation_stripe_webhook_events');
    }
};
