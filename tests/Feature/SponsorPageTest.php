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
                ->where('contactEmail', config('mail.owner.address'))
                ->missing('stripeConfigured'));
    }

    public function test_stripe_checkout_route_is_gone(): void
    {
        $this->post('/sponsor-me/checkout', ['amount' => '10.00', 'cadence' => 'once'])->assertNotFound();
    }

    public function test_old_sponsor_path_redirects_to_the_new_canonical_path(): void
    {
        $this->get('/sponsor')->assertRedirect('/sponsor-me');
    }
}
