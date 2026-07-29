<?php

use App\Models\BioLink;
use Illuminate\Database\Migrations\Migration;

/**
 * Seeds the /bio "Tools" tab (declared as slug 'tools' in Bio.tsx) with a
 * Railway referral link. `tab` stays 'Tools' so BioLink::booted() derives the
 * matching 'tools' slug and the link lands in the existing declared tab
 * instead of spawning a new group. Priority 10 keeps it consistent with the
 * first-entry convention used by the AI, Cashback, and Products tabs.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (app()->environment('testing')) {
            return;
        }

        BioLink::updateOrCreate(
            ['url' => 'https://railway.com?referralCode=55c4MI'],
            [
                'label' => 'Railway',
                'description' => 'Sign up with my link and get $20 credit.',
                'icon' => 'link',
                'tab' => 'Tools',
                'priority' => 10,
                'is_active' => true,
                'featured' => false,
            ]
        );
    }

    public function down(): void
    {
        BioLink::where('url', 'https://railway.com?referralCode=55c4MI')->delete();
    }
};
