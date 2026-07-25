<?php

use App\Models\BioLink;
use Illuminate\Database\Migrations\Migration;

/**
 * Points the header YouTube icon at the SkillupWithHarun channel instead of
 * the old HarunRRayhan one, with `sub_confirmation=1` so the visitor lands
 * straight on the subscribe prompt. Matched on `icon` (unique among bio
 * links) rather than the old `url`, since that's what won't change if this
 * link is ever updated again.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (app()->environment('testing')) {
            return;
        }

        BioLink::where('icon', 'youtube')->update([
            'url' => 'https://www.youtube.com/@SkillupWithHarun?sub_confirmation=1',
        ]);
    }

    public function down(): void
    {
        BioLink::where('icon', 'youtube')->update([
            'url' => 'https://youtube.com/@HarunRRayhan',
        ]);
    }
};
