<?php

use App\Models\BioLink;
use Illuminate\Database\Migrations\Migration;

/**
 * Seeds the /bio "Cashback" tab: a worldwide default (TopCashback's US store)
 * plus two country-locked entries. The US entry stays alongside the default
 * for US visitors; the AU entry replaces the default for AU visitors (the
 * default excludes AU so the two don't both show there).
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

        BioLink::updateOrCreate(
            ['url' => 'https://www.topcashback.com/ref/harunrrayhan'],
            [
                'label' => 'TopCashback',
                'description' => 'Get cashback on your online purchases.',
                'icon' => 'shop',
                'tab' => 'Cashback',
                'priority' => 10,
                'is_active' => true,
                'featured' => false,
                'exclude_countries' => ['AU'],
            ]
        );

        BioLink::updateOrCreate(
            ['url' => 'https://www.topcashback.com/ref/harunrrayhan', 'label' => 'TopCashback (US)'],
            [
                'description' => 'Get cashback on your online purchases.',
                'icon' => 'shop',
                'tab' => 'Cashback',
                'priority' => 20,
                'is_active' => true,
                'featured' => false,
                'include_countries' => ['US'],
            ]
        );

        BioLink::updateOrCreate(
            ['url' => 'https://www.topcashback.com.au/ref/harunrrayhan'],
            [
                'label' => 'TopCashback (AU)',
                'description' => 'Get cashback on your online purchases.',
                'icon' => 'shop',
                'tab' => 'Cashback',
                'priority' => 30,
                'is_active' => true,
                'featured' => false,
                'include_countries' => ['AU'],
            ]
        );
    }

    public function down(): void
    {
        BioLink::where('url', 'https://www.topcashback.com.au/ref/harunrrayhan')->delete();
        BioLink::where('url', 'https://www.topcashback.com/ref/harunrrayhan')->delete();
    }
};
