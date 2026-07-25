<?php

use App\Models\BioLink;
use Illuminate\Database\Migrations\Migration;

/**
 * Seeds the /bio "AI/ML" tab (declared as slug 'ai-tools' in Bio.tsx, tab
 * label overridden to "AI/ML") with its first real entry: a referral link
 * for opencode. `tab` stays 'AI Tools' so BioLink::booted() derives the
 * 'ai-tools' slug and the link lands in the existing declared tab instead of
 * spawning a duplicate "AI/ML" group.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (app()->environment('testing')) {
            return;
        }

        BioLink::updateOrCreate(
            ['url' => 'https://opencode.ai/go?ref=WZW046PT99'],
            [
                'label' => 'opencode',
                'description' => 'Sign up with my link and get $5 extra credit.',
                'icon' => 'link',
                'tab' => 'AI Tools',
                'priority' => 10,
                'is_active' => true,
                'featured' => false,
            ]
        );
    }

    public function down(): void
    {
        BioLink::where('url', 'https://opencode.ai/go?ref=WZW046PT99')->delete();
    }
};
