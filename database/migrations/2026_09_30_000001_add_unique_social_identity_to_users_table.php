<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $hasDuplicates = DB::table('users')
            ->select('provider_name', 'provider_id')
            ->whereNotNull('provider_name')
            ->whereNotNull('provider_id')
            ->groupBy('provider_name', 'provider_id')
            ->havingRaw('COUNT(*) > 1')
            ->exists();

        if ($hasDuplicates) {
            throw new RuntimeException('Duplicate social identities must be reviewed before adding the unique index. Existing accounts have been preserved.');
        }

        Schema::table('users', function (Blueprint $table) {
            $table->unique(['provider_name', 'provider_id'], 'users_social_identity_unique');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique('users_social_identity_unique');
        });
    }
};
