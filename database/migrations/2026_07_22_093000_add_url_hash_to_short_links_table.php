<?php

use App\Models\ShortLink;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('short_links', function (Blueprint $table) {
            $table->string('url_hash', 64)->nullable()->after('destination_url');
            $table->index('url_hash');
        });

        // Backfill existing rows so dedup lookups work retroactively, not just
        // for links created after this migration.
        ShortLink::query()->each(function (ShortLink $link) {
            $link->url_hash = ShortLink::hashFor($link->destination_url);
            $link->saveQuietly();
        });
    }

    public function down(): void
    {
        Schema::table('short_links', function (Blueprint $table) {
            $table->dropIndex(['url_hash']);
            $table->dropColumn('url_hash');
        });
    }
};
