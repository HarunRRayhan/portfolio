<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bio_link_clicks', function (Blueprint $table) {
            // Explicit tag from a link's ?src= query param (e.g. "twitter",
            // "linkedin"). Distinct from `referer`: in-app browsers (Instagram,
            // LinkedIn) often strip or rewrite the Referer header, so this is
            // the only reliable signal for which platform a click came from.
            $table->string('source', 60)->nullable()->after('referer');
        });
    }

    public function down(): void
    {
        Schema::table('bio_link_clicks', function (Blueprint $table) {
            $table->dropColumn('source');
        });
    }
};
