<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    // A credential id may belong to only one account (sqlite and postgres can index text directly).
    public function up(): void
    {
        Schema::table('passkeys', function (Blueprint $table) {
            $table->unique('credential_id');
        });
    }

    public function down(): void
    {
        Schema::table('passkeys', function (Blueprint $table) {
            $table->dropUnique(['credential_id']);
        });
    }
};
