<?php

use App\Models\BioLink;
use Illuminate\Database\Migrations\Migration;

/**
 * Appends two entries to the end of the /bio "Products" tab: the landing
 * page for Harun's LLC, then his personal portfolio site. Matched on
 * `['url' => ..., 'tab' => 'Products']` rather than just `url` -- harun.dev
 * already has an unrelated BioLink row for the header's social "globe"
 * icon (tab 'Social Media'), and reusing that row would strip it from the
 * social icon row instead of adding a new Products entry.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (app()->environment('testing')) {
            return;
        }

        $links = [
            [
                'label' => 'Binary Labs',
                'url' => 'https://binarylabssoft.com',
                'description' => 'My software development LLC',
                'priority' => 60,
            ],
            [
                'label' => 'Portfolio',
                'url' => 'https://harun.dev',
                'description' => 'My personal portfolio site',
                'priority' => 70,
            ],
        ];

        foreach ($links as $link) {
            BioLink::updateOrCreate(
                ['url' => $link['url'], 'tab' => 'Products'],
                [
                    'label' => $link['label'],
                    'description' => $link['description'],
                    'icon' => 'link',
                    'priority' => $link['priority'],
                    'is_active' => true,
                    'featured' => false,
                ]
            );
        }
    }

    public function down(): void
    {
        BioLink::whereIn('url', ['https://binarylabssoft.com', 'https://harun.dev'])
            ->where('tab', 'Products')
            ->delete();
    }
};
