<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Adds the users.role column that App\Models\User and the CheckRole middleware
 * have always assumed exists.
 *
 * Without it every admin route 403s on a fresh database: Eloquent returns null
 * for the missing attribute, so `$user->role !== 'admin'` is always true. The
 * column was presumably added by hand in production, which is why this went
 * unnoticed -- hence the hasColumn guard, so running this against a database
 * that already has it is a no-op rather than an error.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('users', 'role')) {
            return;
        }

        Schema::table('users', function (Blueprint $table) {
            $table->string('role', 20)->default('user')->after('email');
            $table->index('role');
        });
    }

    public function down(): void
    {
        if (! Schema::hasColumn('users', 'role')) {
            return;
        }

        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex(['role']);
            $table->dropColumn('role');
        });
    }
};
