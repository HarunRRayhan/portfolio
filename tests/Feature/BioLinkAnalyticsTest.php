<?php

namespace Tests\Feature;

use App\Models\BioLink;
use App\Models\BioLinkClick;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BioLinkAnalyticsTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        return User::factory()->create([
            'email_verified_at' => now(),
            'role' => 'admin',
        ]);
    }

    private function link(string $label = 'Blog'): BioLink
    {
        return BioLink::create([
            'label' => $label,
            'url' => 'https://example.com',
            'icon' => 'link',
            'tab' => 'default',
        ]);
    }

    /**
     * BioLinkClick has $timestamps = false and leaves created_at to the column
     * default, so it is not fillable -- passing it to create() is silently
     * dropped. forceCreate is what lets a test place a click in the past.
     */
    private function click(BioLink $link, array $attributes = []): BioLinkClick
    {
        return BioLinkClick::forceCreate(array_merge([
            'bio_link_id' => $link->id,
            'created_at' => now(),
        ], $attributes));
    }

    public function test_analytics_requires_authentication(): void
    {
        $this->get('/admin/bio/analytics')->assertRedirect('/login');
    }

    public function test_it_reports_totals_countries_and_referers(): void
    {
        $blog = $this->link('Blog');
        $shop = $this->link('Shop');

        // Deliberately no tie on the country counts -- equal counts leave the
        // ordering up to the database and make the assertion flaky.
        foreach (['BD', 'BD', 'BD'] as $country) {
            $this->click($blog, ['country' => $country, 'referer' => 'https://twitter.com/some/path']);
        }

        $this->click($shop, [
            'country' => 'US',
            'referer' => 'https://news.ycombinator.com/item?id=1',
        ]);

        $props = $this->actingAs($this->admin())
            ->get('/admin/bio/analytics')
            ->assertOk()
            ->viewData('page')['props'];

        $this->assertSame(4, $props['totalClicks']);
        $this->assertSame(4, $props['windowClicks']);

        // Ordered by clicks descending.
        $this->assertSame('Blog', $props['byLink'][0]['label']);
        $this->assertSame(3, $props['byLink'][0]['clicks']);

        $this->assertSame(['key' => 'BD', 'clicks' => 3], $props['byCountry'][0]);

        // Referers collapse to host, so the query string does not fragment counts.
        $hosts = collect($props['byReferer'])->pluck('clicks', 'key');
        $this->assertSame(3, $hosts['twitter.com']);
        $this->assertSame(1, $hosts['news.ycombinator.com']);
    }

    public function test_daily_series_covers_every_day_including_empty_ones(): void
    {
        $link = $this->link();

        $this->click($link);

        $props = $this->actingAs($this->admin())
            ->get('/admin/bio/analytics?days=7')
            ->assertOk()
            ->viewData('page')['props'];

        $this->assertSame(7, $props['days']);
        $this->assertCount(7, $props['daily']);

        // Today is the last bucket and holds the only click.
        $this->assertSame(now()->toDateString(), $props['daily'][6]['date']);
        $this->assertSame(1, $props['daily'][6]['clicks']);
        $this->assertSame(0, $props['daily'][0]['clicks']);
    }

    public function test_clicks_outside_the_window_are_excluded(): void
    {
        $link = $this->link();

        $this->click($link, ['created_at' => now()->subDays(40)]);

        $props = $this->actingAs($this->admin())
            ->get('/admin/bio/analytics?days=30')
            ->assertOk()
            ->viewData('page')['props'];

        $this->assertSame(1, $props['totalClicks']);
        $this->assertSame(0, $props['windowClicks']);
    }

    public function test_an_unexpected_range_falls_back_to_thirty_days(): void
    {
        $props = $this->actingAs($this->admin())
            ->get('/admin/bio/analytics?days=9999')
            ->assertOk()
            ->viewData('page')['props'];

        $this->assertSame(30, $props['days']);
        $this->assertCount(30, $props['daily']);
    }
}
