<?php

use App\Models\BioLink;
use Illuminate\Database\Migrations\Migration;

/**
 * SlashAdmin referral entry in the /bio "Tools" tab. BioLink::booted() creates
 * the /s/{code} short link when the url is set.
 */
return new class extends Migration
{
    private const URL = 'https://app.slash.com/i/harun';

    public function up(): void
    {
        if (app()->environment('testing')) {
            return;
        }

        BioLink::updateOrCreate(
            ['url' => self::URL],
            [
                'label' => 'SlashAdmin',
                'description' => 'Sign up with my referral link.',
                'icon' => 'link',
                'tab' => 'Tools',
                'priority' => 20,
                'is_active' => true,
                'featured' => false,
            ]
        );
    }

    public function down(): void
    {
        BioLink::where('url', self::URL)->delete();
    }
};
