<?php

use App\Models\BioLink;
use Illuminate\Database\Migrations\Migration;

/**
 * Seeds the /bio "Products" tab with Harun's real products (from
 * resources/js/Pages/Products.tsx), so the tab has content as soon as the
 * frontend's always-visible Products/AI Tools tabs ship. Keyed on `url` and
 * run through Eloquent (not raw inserts) so BioLink::booted() derives
 * `tab_slug` from `tab` the same way the admin UI does.
 *
 * Deliberately avoids the `globe`/`mail` icons: those now render in the
 * social icon row (see SOCIAL_ICONS in Bio.tsx), not the tabbed link list.
 */
return new class extends Migration
{
    public function up(): void
    {
        // Data-seed migration, not schema: skip in the testing environment so
        // it doesn't pollute the fresh `bio_links` table RefreshDatabase gives
        // each test (several existing tests assert the table starts empty).
        if (app()->environment('testing')) {
            return;
        }

        $products = [
            ['label' => 'Toolblip', 'url' => 'https://toolblip.com', 'icon' => 'link', 'priority' => 10],
            ['label' => 'PloyCloud', 'url' => 'https://ploy.cloud', 'icon' => 'work', 'priority' => 20],
            ['label' => 'Crontinel', 'url' => 'https://crontinel.com', 'icon' => 'link', 'priority' => 30],
            ['label' => 'Appnary', 'url' => 'https://appnary.com', 'icon' => 'shop', 'priority' => 40],
            ['label' => 'Amazing Plugins', 'url' => 'https://amazingplugins.com', 'icon' => 'shop', 'priority' => 50],
        ];

        foreach ($products as $product) {
            BioLink::updateOrCreate(
                ['url' => $product['url']],
                [
                    'label' => $product['label'],
                    'icon' => $product['icon'],
                    'tab' => 'Products',
                    'priority' => $product['priority'],
                    'is_active' => true,
                    'featured' => false,
                ]
            );
        }
    }

    public function down(): void
    {
        BioLink::whereIn('url', [
            'https://toolblip.com',
            'https://ploy.cloud',
            'https://crontinel.com',
            'https://appnary.com',
            'https://amazingplugins.com',
        ])->delete();
    }
};
