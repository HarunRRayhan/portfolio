<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Seeds the Bangla (/hrr) social row with placeholders.
 *
 * The URLs here are deliberately fake and every row lands inactive, so nothing
 * shows on /hrr until Harun supplies his real Bangla-audience handles. Once he
 * does, update each row's label/url and flip is_active to true, either through
 * /admin/bio or in a follow-up migration. Rows are written straight through the
 * query builder rather than the model so the saving hook doesn't mint short
 * links for URLs that are about to change.
 */
return new class extends Migration
{
    private const PLACEHOLDER_URLS = [
        'instagram' => 'https://instagram.com/TODO_BANGLA_HANDLE',
        'tiktok' => 'https://tiktok.com/@TODO_BANGLA_HANDLE',
        'youtube' => 'https://youtube.com/@TODO_BANGLA_HANDLE',
        'facebook' => 'https://facebook.com/TODO_BANGLA_HANDLE',
        'threads' => 'https://threads.net/@TODO_BANGLA_HANDLE',
        'twitter' => 'https://x.com/TODO_BANGLA_HANDLE',
    ];

    public function up(): void
    {
        if (app()->environment('testing')) {
            return;
        }

        $now = now();

        DB::table('bio_links')->insert(collect(self::PLACEHOLDER_URLS)
            ->map(fn (string $url, string $icon) => [
                'label' => ucfirst($icon).' (Bangla)',
                'locale' => 'bn',
                'url' => $url,
                'tab' => 'default',
                'tab_slug' => 'default',
                'icon' => $icon,
                'featured' => false,
                'priority' => 0,
                'is_active' => false,
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
            ->whereIn('url', array_values(self::PLACEHOLDER_URLS))
            ->delete();
    }
};
