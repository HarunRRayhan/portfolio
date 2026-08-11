<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('short_link_clicks', function (Blueprint $table) {
            // Explicit tag from a link's ?src= query param, same purpose as
            // bio_link_clicks.source -- see that migration for why it exists
            // alongside `referer`.
            $table->string('source', 60)->nullable()->after('referer');
        });
    }

    public function down(): void
    {
        Schema::table('short_link_clicks', function (Blueprint $table) {
            $table->dropColumn('source');
        });
    }
};
