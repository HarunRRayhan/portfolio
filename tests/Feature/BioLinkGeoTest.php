<?php

namespace Tests\Feature;

use App\Models\BioLink;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BioLinkGeoTest extends TestCase
{
    use RefreshDatabase;

    private function link(array $attributes = []): BioLink
    {
        return new BioLink(array_merge([
            'label' => 'Example',
            'url' => 'https://example.com',
            'icon' => 'link',
            'tab' => 'default',
        ], $attributes));
    }

    public function test_link_without_country_rules_is_visible_everywhere(): void
    {
        $link = $this->link();

        $this->assertTrue($link->isVisibleInCountry('BD'));
        $this->assertTrue($link->isVisibleInCountry('US'));
        $this->assertTrue($link->isVisibleInCountry(null));
    }

    public function test_include_list_restricts_to_listed_countries(): void
    {
        $link = $this->link(['include_countries' => ['BD', 'IN']]);

        $this->assertTrue($link->isVisibleInCountry('BD'));
        $this->assertTrue($link->isVisibleInCountry('IN'));
        $this->assertFalse($link->isVisibleInCountry('US'));
    }

    public function test_exclude_list_hides_listed_countries(): void
    {
        $link = $this->link(['exclude_countries' => ['US']]);

        $this->assertFalse($link->isVisibleInCountry('US'));
        $this->assertTrue($link->isVisibleInCountry('BD'));
    }

    public function test_exclude_wins_when_a_country_is_on_both_lists(): void
    {
        $link = $this->link([
            'include_countries' => ['BD', 'US'],
            'exclude_countries' => ['US'],
        ]);

        $this->assertTrue($link->isVisibleInCountry('BD'));
        $this->assertFalse($link->isVisibleInCountry('US'));
    }

    /**
     * When geo lookup fails we cannot prove the visitor is in the include list,
     * so include-restricted links stay hidden. Exclusion cannot be proven either,
     * so an exclude-only link still shows -- failing open on exclude keeps a
     * missing GeoLite2 database from silently emptying the page.
     */
    public function test_unknown_country_hides_include_restricted_links_but_not_excluded_ones(): void
    {
        $this->assertFalse($this->link(['include_countries' => ['BD']])->isVisibleInCountry(null));
        $this->assertTrue($this->link(['exclude_countries' => ['US']])->isVisibleInCountry(null));
    }

    public function test_country_matching_is_case_insensitive(): void
    {
        $link = $this->link(['include_countries' => ['bd']]);

        $this->assertTrue($link->isVisibleInCountry('BD'));
        $this->assertTrue($link->isVisibleInCountry('bd'));
    }

    public function test_empty_arrays_behave_like_no_restriction(): void
    {
        $link = $this->link([
            'include_countries' => [],
            'exclude_countries' => [],
        ]);

        $this->assertTrue($link->isVisibleInCountry('US'));
        $this->assertTrue($link->isVisibleInCountry(null));
    }

    public function test_bio_page_hides_links_the_visitor_country_is_excluded_from(): void
    {
        BioLink::create([
            'label' => 'Everyone',
            'url' => 'https://example.com/all',
            'icon' => 'link',
            'tab' => 'default',
        ]);

        BioLink::create([
            'label' => 'Bangladesh only',
            'url' => 'https://example.com/bd',
            'icon' => 'link',
            'tab' => 'default',
            'include_countries' => ['BD'],
        ]);

        $this->mock(\App\Services\CountryResolver::class)
            ->shouldReceive('resolve')
            ->andReturn('US');

        $response = $this->get('/bio');

        $response->assertOk();
        $labels = collect($response->viewData('page')['props']['links'])->pluck('label');

        $this->assertContains('Everyone', $labels);
        $this->assertNotContains('Bangladesh only', $labels);
    }
}
