<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('profile_slug', 16)->nullable()->unique();
            $table->boolean('anonymous')->default(false);
            $table->string('anon_name', 40)->nullable();
            $table->string('bio', 280)->nullable();
        });

        DB::table('users')->whereNull('profile_slug')->orderBy('id')->select('id')->each(
            fn ($u) => DB::table('users')->where('id', $u->id)->update(['profile_slug' => Str::lower(Str::random(10))])
        );
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique(['profile_slug']);
            $table->dropColumn(['profile_slug', 'anonymous', 'anon_name', 'bio']);
        });
    }
};
