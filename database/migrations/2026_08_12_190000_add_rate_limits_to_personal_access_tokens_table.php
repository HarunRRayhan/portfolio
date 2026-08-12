<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('personal_access_tokens', function (Blueprint $table) {
            // Null means "use the default" (60/min, 2000/day) -- see the
            // api-key rate limiter registered in AppServiceProvider.
            $table->integer('rate_limit_per_minute')->nullable()->after('abilities');
            $table->integer('rate_limit_per_day')->nullable()->after('rate_limit_per_minute');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('personal_access_tokens', function (Blueprint $table) {
            $table->dropColumn(['rate_limit_per_minute', 'rate_limit_per_day']);
        });
    }
};
