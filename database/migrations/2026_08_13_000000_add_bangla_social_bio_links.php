<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Seeds the Bangla (/hrr) social row with Harun's real handles.
 *
 * Every row is live: these are the actual Bangla-audience accounts, labelled in
 * Bangla, and each lands active so /hrr renders the full seven icon row
 * (Facebook, Instagram, TikTok, YouTube, X, Threads, Bluesky). The shared
 * identities (LinkedIn, GitHub, website, email) are untouched and keep showing
 * on both locales. Rows are written straight through the query builder rather
 * than the model so the saving hook doesn't mint short links during migration.
 */
return new class extends Migration
{
    private const SOCIAL_LINKS = [
        'facebook' => ['ফেসবুক', 'https://facebook.com/HarunRRayhan'],
        'instagram' => ['ইনস্টাগ্রাম', 'https://instagram.com/harunrrayhan'],
        'tiktok' => ['টিকটক', 'https://tiktok.com/@harunrrayhan'],
        'youtube' => ['ইউটিউব', 'https://youtube.com/@skillupwithharun'],
        'twitter' => ['টুইটার', 'https://x.com/HarunRRayhan'],
        'threads' => ['থ্রেডস', 'https://threads.net/@harunrrayhan'],
        'bluesky' => ['ব্লুস্কাই', 'https://bsky.app/profile/harunrrayhan.bsky.social'],
    ];

    public function up(): void
    {
        if (app()->environment('testing')) {
            return;
        }

        $now = now();

        DB::table('bio_links')->insert(collect(self::SOCIAL_LINKS)
            ->map(fn (array $link, string $icon) => [
                'label' => $link[0],
                'locale' => 'bn',
                'url' => $link[1],
                'tab' => 'default',
                'tab_slug' => 'default',
                'icon' => $icon,
                'featured' => false,
                'priority' => 0,
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ])
            ->values()
            ->all());
    }

    public function down(): void
    {
        if (app()->environment('testing')) {
            return;
        }

        DB::table('bio_links')
            ->where('locale', 'bn')
            ->whereIn('url', array_column(self::SOCIAL_LINKS, 1))
            ->delete();
    }
};
