<?php

use App\Models\BioLink;
use App\Models\ShortLink;
use Illuminate\Database\Migrations\Migration;

/**
 * 2026_07_25_161500_update_youtube_bio_link_url set the YouTube BioLink's
 * `url` via a mass `Builder::update()`, which bypasses BioLink::booted()'s
 * `saving` hook -- so `short_link_id` was never repointed and the public
 * short link (/s/{code}) kept redirecting to the old channel. This resolves
 * (or creates) the ShortLink for the row's current url and repoints
 * short_link_id, replicating what the hook would have done on a normal save.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (app()->environment('testing')) {
            return;
        }

        $link = BioLink::where('icon', 'youtube')->first();

        if (! $link) {
            return;
        }

        $shortLink = ShortLink::getOrCreateForUrl($link->url, $link->label);

        BioLink::where('id', $link->id)->update(['short_link_id' => $shortLink?->id]);
    }

    public function down(): void
    {
        // Intentionally irreversible: there's no reliable record of which
        // short link this row pointed to before this migration ran.
    }
};
