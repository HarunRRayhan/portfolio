<?php

use App\Models\BioLink;
use Illuminate\Database\Migrations\Migration;

/**
 * The "AI Tools" bio tab (slug 'ai-tools') is now just "AI" (slug 'ai') --
 * general dev tools are moving to their own new "Tools" tab instead of
 * sharing this one. Existing links only need their `tab` string updated;
 * BioLink::booted() re-derives `tab_slug` from it on save.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (app()->environment('testing')) {
            return;
        }

        BioLink::where('tab_slug', 'ai-tools')->get()->each(function (BioLink $link) {
            $link->update(['tab' => 'AI']);
        });
    }

    public function down(): void
    {
        BioLink::where('tab_slug', 'ai')->get()->each(function (BioLink $link) {
            $link->update(['tab' => 'AI Tools']);
        });
    }
};
