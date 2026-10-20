<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('newsletter_deliveries', function (Blueprint $table) {
            $table->timestamp('opened_at')->nullable();
        });

        Schema::create('newsletter_clicks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('newsletter_delivery_id')->constrained()->cascadeOnDelete();
            $table->string('url', 2048);
            $table->timestamp('created_at')->nullable();

            $table->index('newsletter_delivery_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('newsletter_clicks');

        Schema::table('newsletter_deliveries', function (Blueprint $table) {
            $table->dropColumn('opened_at');
        });
    }
};
