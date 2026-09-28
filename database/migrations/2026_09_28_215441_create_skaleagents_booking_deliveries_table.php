<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('skaleagents_booking_deliveries', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('consultation_booking_id')->constrained()->cascadeOnDelete();
            $table->foreignId('consultation_booking_event_id')->unique()->constrained()->cascadeOnDelete();
            $table->text('payload');
            $table->unsignedInteger('attempt_count')->default(0);
            $table->timestampTz('next_attempt_at')->nullable();
            $table->unsignedSmallInteger('last_http_status')->nullable();
            $table->string('last_error', 80)->nullable();
            $table->timestampTz('delivered_at')->nullable();
            $table->timestampTz('terminal_at')->nullable();
            $table->timestamps();

            $table->index(['next_attempt_at', 'id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('skaleagents_booking_deliveries');
    }
};
