<?php

namespace Tests\Feature;

use Tests\TestCase;

class SponsorPageTest extends TestCase
{
    public function test_sponsor_page_links_to_github_sponsors(): void
    {
        $this->get('/sponsor-me')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Sponsor')
                ->where('canonicalUrl', rtrim((string) config('app.url'), '/').'/sponsor-me')
                ->where('sponsorsUrl', config('sponsors.url'))
                ->where('contactUrl', route('contact'))
                ->where('contactEmail', config('mail.owner.address')));
    }

    public function test_no_stripe_tables_or_columns_remain(): void
    {
        $this->assertFalse(\Illuminate\Support\Facades\Schema::hasTable('consultation_stripe_webhook_events'));
        $this->assertFalse(\Illuminate\Support\Facades\Schema::hasTable('consultation_stripe_checkout_attempts'));
        $this->assertSame([], preg_grep('/^stripe_/', \Illuminate\Support\Facades\Schema::getColumnListing('consultation_bookings')));
    }

    public function test_old_sponsor_path_redirects_to_the_new_canonical_path(): void
    {
        $this->get('/sponsor')->assertRedirect('/sponsor-me');
    }
}
