<?php

use App\Models\BioLink;
use App\Models\ShortLink;
use Illuminate\Database\Migrations\Migration;

/**
 * The General cashback entry and the US-only entry point at the same
 * destination URL, so they'd shared one auto-deduped ShortLink row. That's a
 * problem now: the General link's short/share URL needs to redirect AU
 * visitors to the AU store while everyone else keeps landing on the US
 * store, but the US-only link must always land on the US store regardless
 * of visitor location. Sharing a short code would geo-redirect both.
 *
 * This gives the General entry its own ShortLink row (same US destination,
 * plus an AU override) and repoints its short_link_id there, leaving the
 * US-only entry on the original, override-free row.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (app()->environment('testing')) {
            return;
        }

        $general = BioLink::where('tab', 'Cashback')->where('label', 'TopCashback')->first();

        if (! $general) {
            return;
        }

        $shortLink = ShortLink::create([
            'destination_url' => 'https://www.topcashback.com/ref/harunrrayhan',
            'country_overrides' => ['AU' => 'https://www.topcashback.com.au/ref/harunrrayhan'],
            'title' => 'TopCashback (geo-routed)',
        ]);

        BioLink::where('id', $general->id)->update(['short_link_id' => $shortLink->id]);
    }

    public function down(): void
    {
        $general = BioLink::where('tab', 'Cashback')->where('label', 'TopCashback')->first();

        if (! $general) {
            return;
        }

        $shared = ShortLink::where('url_hash', ShortLink::hashFor('https://www.topcashback.com/ref/harunrrayhan'))
            ->where('title', 'TopCashback')
            ->first();

        $geoRouted = ShortLink::where('title', 'TopCashback (geo-routed)')->first();

        if ($shared) {
            BioLink::where('id', $general->id)->update(['short_link_id' => $shared->id]);
        }

        $geoRouted?->delete();
    }
};
