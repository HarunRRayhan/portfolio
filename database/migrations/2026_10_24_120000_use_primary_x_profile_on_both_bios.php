<?php

use App\Models\BioLink;
use Illuminate\Database\Migrations\Migration;

/**
 * Both bios (/bio and the Bangla /hrr) link the primary X profile, @harundotdev.
 * The Bangla row was seeded with the optional @HarunRRayhan account. Updated
 * through the model so the short link follows the new destination.
 */
return new class extends Migration
{
    public function up(): void
    {
        BioLink::where('icon', 'twitter')->get()
            ->each(fn (BioLink $link) => $link->update(['url' => 'https://x.com/harundotdev']));
    }

    public function down(): void
    {
        BioLink::where('icon', 'twitter')->where('locale', 'bn')->get()
            ->each(fn (BioLink $link) => $link->update(['url' => 'https://x.com/HarunRRayhan']));
    }
};
