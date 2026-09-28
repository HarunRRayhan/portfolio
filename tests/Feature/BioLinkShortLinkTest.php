<?php

namespace Tests\Feature;

use App\Models\BioLink;
use App\Models\ShortLink;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BioLinkShortLinkTest extends TestCase
{
    use RefreshDatabase;

    public function test_hrr_youtube_update_changes_only_the_bangla_link_and_its_share_destination(): void
    {
        $bangla = BioLink::create([
            'label' => 'ইউটিউব',
            'locale' => 'bn',
            'url' => 'https://youtube.com/@skillupwithharun',
            'icon' => 'youtube',
            'tab' => 'default',
        ]);
        $english = BioLink::create([
            'label' => 'YouTube',
            'locale' => 'en',
            'url' => 'https://www.youtube.com/@SkillupWithHarun?sub_confirmation=1',
            'icon' => 'youtube',
            'tab' => 'default',
        ]);

        $migration = require database_path('migrations/2026_09_28_130000_update_hrr_youtube_bio_link.php');
        $migration->up();

        $bangla->refresh();
        $english->refresh();
        $props = $this->get('/hrr')->assertOk()->viewData('page')['props'];
        $youtube = collect($props['links'])->firstWhere('id', $bangla->id);

        $this->assertSame('https://www.youtube.com/@HarunRRayhan', $youtube['url']);
        $this->assertSame('https://www.youtube.com/@HarunRRayhan', $bangla->shortLink->destination_url);
        $this->assertSame($bangla->shortLink->short_url, $youtube['share_url']);
        $this->assertSame('https://www.youtube.com/@SkillupWithHarun?sub_confirmation=1', $english->url);
    }

    public function test_cloudploy_domain_update_keeps_the_bio_short_link_current(): void
    {
        $link = BioLink::create([
            'label' => 'PloyCloud',
            'url' => 'https://ploy.cloud',
            'description' => 'Managed hosting',
            'icon' => 'work',
            'tab' => 'Products',
        ]);

        $migration = require database_path('migrations/2026_09_28_120000_update_cloudploy_bio_link.php');
        $migration->up();
        $link->refresh();

        $this->assertSame('CloudPloy', $link->label);
        $this->assertSame('https://cloudploy.com', $link->url);
        $this->assertSame('https://cloudploy.com', $link->shortLink->destination_url);
    }

    public function test_saving_a_bio_link_with_an_external_url_resolves_a_short_link(): void
    {
        $link = BioLink::create([
            'label' => 'Blog',
            'url' => 'https://example.com/blog',
            'icon' => 'link',
            'tab' => 'default',
        ]);

        $this->assertNotNull($link->short_link_id);
        $this->assertSame('https://example.com/blog', $link->shortLink->destination_url);
    }

    public function test_saving_a_bio_link_with_an_internal_url_leaves_short_link_null(): void
    {
        $link = BioLink::create([
            'label' => 'Contact',
            'url' => '/contact',
            'icon' => 'link',
            'tab' => 'default',
        ]);

        $this->assertNull($link->short_link_id);
    }

    public function test_two_bio_links_to_the_same_destination_share_one_short_link(): void
    {
        $first = BioLink::create([
            'label' => 'Blog',
            'url' => 'https://example.com/blog',
            'icon' => 'link',
            'tab' => 'default',
        ]);

        $second = BioLink::create([
            'label' => 'Blog Again',
            'url' => 'https://example.com/blog',
            'icon' => 'link',
            'tab' => 'default',
        ]);

        $this->assertSame($first->short_link_id, $second->short_link_id);
        $this->assertSame(1, ShortLink::count());
    }

    public function test_editing_a_bio_link_url_re_points_the_short_link(): void
    {
        $link = BioLink::create([
            'label' => 'Blog',
            'url' => 'https://example.com/blog',
            'icon' => 'link',
            'tab' => 'default',
        ]);
        $original = $link->short_link_id;

        $link->update(['url' => 'https://example.com/newsletter']);

        $this->assertNotSame($original, $link->short_link_id);
        $this->assertSame('https://example.com/newsletter', $link->shortLink->destination_url);
    }

    public function test_editing_a_bio_link_url_to_internal_clears_the_short_link(): void
    {
        $link = BioLink::create([
            'label' => 'Blog',
            'url' => 'https://example.com/blog',
            'icon' => 'link',
            'tab' => 'default',
        ]);

        $link->update(['url' => '/contact']);

        $this->assertNull($link->short_link_id);
    }

    public function test_the_bio_page_exposes_the_short_url_as_share_url(): void
    {
        BioLink::create([
            'label' => 'Blog',
            'url' => 'https://example.com/blog',
            'icon' => 'link',
            'tab' => 'default',
        ]);
        BioLink::create([
            'label' => 'Contact',
            'url' => '/contact',
            'icon' => 'link',
            'tab' => 'default',
        ]);

        $props = $this->get('/bio')->assertOk()->viewData('page')['props'];

        $byLabel = collect($props['links'])->keyBy('label');

        $this->assertStringContainsString('/s/', $byLabel['Blog']['share_url']);
        $this->assertSame('https://example.com/blog', $byLabel['Blog']['url']);

        // Internal links have nothing to shorten -- share_url just mirrors url.
        $this->assertSame('/contact', $byLabel['Contact']['share_url']);
    }

    public function test_the_bio_page_exposes_short_urls_for_the_page_and_each_tab(): void
    {
        BioLink::create([
            'label' => 'Blog',
            'url' => 'https://example.com/blog',
            'icon' => 'link',
            'tab' => 'default',
        ]);
        BioLink::create([
            'label' => 'Shop',
            'url' => 'https://example.com/shop',
            'icon' => 'link',
            'tab' => 'Products',
        ]);

        $props = $this->get('/bio')->assertOk()->viewData('page')['props'];

        $this->assertStringContainsString('/s/', $props['page_share_url']);
        $this->assertStringContainsString('/s/', $props['tab_share_urls']['default']);
        $this->assertStringContainsString('/s/', $props['tab_share_urls']['products']);
        $this->assertNotSame($props['tab_share_urls']['default'], $props['tab_share_urls']['products']);
    }
}
