<?php

use App\Models\BioLink;
use Illuminate\Database\Migrations\Migration;

/**
 * Backfills `description` for the /bio "Products" tab links seeded in
 * 2026_07_21_154845_seed_product_bio_links.php, reusing the taglines from
 * resources/js/Pages/Products.tsx so both pages describe each product the
 * same way. Keyed on `url`, same as the seed migration.
 */
return new class extends Migration
{
    public function up(): void
    {
        // Data-seed migration, not schema: skip in the testing environment so
        // it doesn't pollute the fresh `bio_links` table RefreshDatabase gives
        // each test.
        if (app()->environment('testing')) {
            return;
        }

        $descriptions = [
            'https://toolblip.com' => 'Free online developer tools',
            'https://ploy.cloud' => 'Managed hosting for Laravel, WordPress, PHP, and Node.js',
            'https://crontinel.com' => 'Cron, queue, and background job monitoring',
            'https://appnary.com' => 'Shopify apps for merchants',
            'https://amazingplugins.com' => 'Free WooCommerce plugins',
        ];

        foreach ($descriptions as $url => $description) {
            BioLink::where('url', $url)->update(['description' => $description]);
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
        ])->update(['description' => null]);
    }
};
