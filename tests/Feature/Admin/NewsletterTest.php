<?php

namespace Tests\Feature\Admin;

use App\Models\Subscriber;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Log;
use Tests\TestCase;

class NewsletterTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        return User::factory()->create(['email_verified_at' => now(), 'role' => 'admin']);
    }

    public function test_the_index_requires_authentication(): void
    {
        $this->get('/admin/newsletter')->assertRedirect('/login');
    }

    public function test_a_non_admin_cannot_reach_the_index(): void
    {
        $user = User::factory()->create(['email_verified_at' => now()]);

        $this->actingAs($user)->get('/admin/newsletter')->assertForbidden();
    }

    public function test_the_index_reports_the_total_subscriber_count(): void
    {
        $admin = $this->admin();
        Subscriber::factory()->count(3)->create();

        $response = $this->actingAs($admin)->get('/admin/newsletter', $this->inertiaHeaders());

        $response->assertOk();
        $response->assertJson(['component' => 'Admin/Newsletter/Index']);
        $this->assertSame(3, $response->json('props.subscribers.total'));
    }

    public function test_the_index_never_exposes_real_email_addresses(): void
    {
        $admin = $this->admin();
        Subscriber::factory()->create(['email' => 'harun@gmail.com']);

        $response = $this->actingAs($admin)->get('/admin/newsletter', $this->inertiaHeaders());

        $response->assertOk();
        $this->assertStringNotContainsString('harun@gmail.com', $response->getContent());
        $this->assertSame('ha***@gmail.com', $response->json('props.subscribers.data.0.masked_email'));
    }

    public function test_the_index_is_paginated(): void
    {
        $admin = $this->admin();
        Subscriber::factory()->count(30)->create();

        $response = $this->actingAs($admin)->get('/admin/newsletter', $this->inertiaHeaders());

        $response->assertOk();
        $this->assertCount(25, $response->json('props.subscribers.data'));
        $this->assertSame(30, $response->json('props.subscribers.total'));
    }

    public function test_the_index_404s_for_a_non_numeric_reveal_id(): void
    {
        $admin = $this->admin();

        $this->actingAs($admin)->post('/admin/newsletter/not-a-number/reveal')->assertNotFound();
    }

    public function test_the_index_404s_for_an_id_too_large_for_a_bigint_column(): void
    {
        $admin = $this->admin();

        $this->actingAs($admin)
            ->post('/admin/newsletter/99999999999999999999999999999/reveal')
            ->assertNotFound();
    }

    public function test_an_admin_can_reveal_a_subscribers_real_email(): void
    {
        $admin = $this->admin();
        $subscriber = Subscriber::factory()->create(['email' => 'harun@gmail.com']);

        $response = $this->actingAs($admin)->post("/admin/newsletter/{$subscriber->id}/reveal");

        $response->assertOk();
        $response->assertJson(['email' => 'harun@gmail.com']);
        $response->assertHeader('Cache-Control', 'no-store, private');
    }

    public function test_revealing_an_email_writes_an_audit_log_entry(): void
    {
        Log::spy();
        $admin = $this->admin();
        $subscriber = Subscriber::factory()->create(['email' => 'harun@gmail.com']);

        $this->actingAs($admin)->post("/admin/newsletter/{$subscriber->id}/reveal");

        Log::shouldHaveReceived('info')
            ->once()
            ->withArgs(fn ($message, $context) => $context['admin_id'] === $admin->id
                && $context['subscriber_id'] === $subscriber->id);
    }

    public function test_a_non_admin_cannot_reveal_a_subscribers_email(): void
    {
        $user = User::factory()->create(['email_verified_at' => now()]);
        $subscriber = Subscriber::factory()->create(['email' => 'harun@gmail.com']);

        $this->actingAs($user)->post("/admin/newsletter/{$subscriber->id}/reveal")->assertForbidden();
    }

    public function test_a_non_admin_gets_forbidden_not_not_found_for_a_nonexistent_id(): void
    {
        // Regression guard: the role check must run before the subscriber
        // lookup, or a non-admin could tell real ids from fake ones by
        // whether they get 403 (exists, role check failed) vs 404
        // (lookup failed) -- deanonymizing which numeric ids are real.
        $user = User::factory()->create(['email_verified_at' => now()]);

        $this->actingAs($user)->post('/admin/newsletter/999999/reveal')->assertForbidden();
    }

    public function test_an_unauthenticated_user_cannot_reveal_a_subscribers_email(): void
    {
        $subscriber = Subscriber::factory()->create(['email' => 'harun@gmail.com']);

        $this->post("/admin/newsletter/{$subscriber->id}/reveal")->assertRedirect('/login');
    }

    public function test_an_unauthenticated_xhr_reveal_request_gets_a_401_not_a_redirect(): void
    {
        $subscriber = Subscriber::factory()->create(['email' => 'harun@gmail.com']);

        // Headers axios actually sends by default (bootstrap.ts sets
        // X-Requested-With globally; Accept is axios's own built-in
        // default) -- this is what EmailCell's reveal request looks like
        // on the wire, not a plain browser navigation.
        $this->post("/admin/newsletter/{$subscriber->id}/reveal", [], [
            'X-Requested-With' => 'XMLHttpRequest',
            'Accept' => 'application/json, text/plain, */*',
        ])->assertUnauthorized();
    }
}
