<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payment_requests', function (Blueprint $table) {
            $table->id();
            $table->ulid('public_id')->unique();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name');
            $table->string('email');
            $table->string('country', 2);
            $table->string('plan', 20);
            $table->string('method', 20);
            $table->text('note')->nullable();
            $table->string('status', 20)->default('new')->index();
            $table->string('transaction_id', 64)->nullable();
            $table->string('payer_phone', 32)->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->foreignId('grant_id')->nullable()->constrained('roadmap_access_grants')->nullOnDelete();
            $table->timestamp('decided_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payment_requests');
    }
};
