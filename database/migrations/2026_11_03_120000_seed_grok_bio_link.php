<?php

use App\Models\BioLink;
use Illuminate\Database\Migrations\Migration;

/**
 * Grok referral entry in the /bio "AI/ML" tab. BioLink::booted() creates the
 * /s/{code} short link when the url is set.
 */
return new class extends Migration
{
    private const URL = 'https://grok.com/refer/bot?code=BPPW7Q72VKBC';

    public function up(): void
    {
        if (app()->environment('testing')) {
            return;
        }

        BioLink::updateOrCreate(
            ['url' => self::URL],
            [
                'label' => 'Grok',
                'description' => 'Sign up with my link and get two weeks free. I get a usage reset too.',
                'icon' => 'link',
                'tab' => 'AI',
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
