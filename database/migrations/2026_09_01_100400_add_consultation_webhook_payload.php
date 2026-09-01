<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('consultation_stripe_webhook_events', function (Blueprint $table) {
            $table->text('payload')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('consultation_stripe_webhook_events', function (Blueprint $table) {
            $table->dropColumn('payload');
        });
    }
};
