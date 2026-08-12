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
        Schema::table('short_links', function (Blueprint $table) {
            // Null = legacy/admin-created link with no owner -- only an
            // admin may modify those. Links created through the API are
            // stamped with the token owner's user id.
            $table->foreignId('user_id')->nullable()->after('id')
                ->constrained('users')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('short_links', function (Blueprint $table) {
            $table->dropConstrainedForeignId('user_id');
        });
    }
};
