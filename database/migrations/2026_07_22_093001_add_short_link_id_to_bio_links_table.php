<?php

use App\Models\BioLink;
use App\Models\ShortLink;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bio_links', function (Blueprint $table) {
            $table->foreignId('short_link_id')->nullable()->after('url')
                ->constrained('short_links')->nullOnDelete();
        });

        // Backfill: give every existing external bio link a short link so
        // clicks start routing through /s/{code} without waiting on an edit.
        BioLink::query()->each(function (BioLink $link) {
            $shortLink = ShortLink::getOrCreateForUrl($link->url, $link->label);

            if ($shortLink) {
                $link->short_link_id = $shortLink->id;
                $link->saveQuietly();
            }
        });
    }

    public function down(): void
    {
        Schema::table('bio_links', function (Blueprint $table) {
            $table->dropConstrainedForeignId('short_link_id');
        });
    }
};
