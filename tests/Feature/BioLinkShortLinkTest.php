<?php

namespace Tests\Feature;

use App\Models\BioLink;
use App\Models\ShortLink;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BioLinkShortLinkTest extends TestCase
{
    use RefreshDatabase;

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
}
