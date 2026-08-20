<?php

namespace Tests\Feature\Admin;

use App\Models\Subscriber;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
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

        $response = $this->actingAs($admin)->get('/admin/newsletter', ['X-Inertia' => 'true']);

        $response->assertOk();
        $response->assertJson(['component' => 'Admin/Newsletter/Index']);
        $this->assertSame(3, $response->json('props.total'));
    }

    public function test_the_index_never_exposes_real_email_addresses(): void
    {
        $admin = $this->admin();
        Subscriber::factory()->create(['email' => 'harun@gmail.com']);

        $response = $this->actingAs($admin)->get('/admin/newsletter', ['X-Inertia' => 'true']);

        $response->assertOk();
        $this->assertStringNotContainsString('harun@gmail.com', $response->getContent());
        $this->assertSame('ha***@gmail.com', $response->json('props.subscribers.data.0.masked_email'));
    }

    public function test_the_index_is_paginated(): void
    {
        $admin = $this->admin();
        Subscriber::factory()->count(30)->create();

        $response = $this->actingAs($admin)->get('/admin/newsletter', ['X-Inertia' => 'true']);

        $response->assertOk();
        $this->assertCount(25, $response->json('props.subscribers.data'));
        $this->assertSame(30, $response->json('props.subscribers.total'));
    }

    public function test_an_admin_can_reveal_a_subscribers_real_email(): void
    {
        $admin = $this->admin();
        $subscriber = Subscriber::factory()->create(['email' => 'harun@gmail.com']);

        $response = $this->actingAs($admin)->get("/admin/newsletter/{$subscriber->id}/reveal");

        $response->assertOk();
        $response->assertJson(['email' => 'harun@gmail.com']);
    }

    public function test_a_non_admin_cannot_reveal_a_subscribers_email(): void
    {
        $user = User::factory()->create(['email_verified_at' => now()]);
        $subscriber = Subscriber::factory()->create(['email' => 'harun@gmail.com']);

        $this->actingAs($user)->get("/admin/newsletter/{$subscriber->id}/reveal")->assertForbidden();
    }

    public function test_an_unauthenticated_user_cannot_reveal_a_subscribers_email(): void
    {
        $subscriber = Subscriber::factory()->create(['email' => 'harun@gmail.com']);

        $this->get("/admin/newsletter/{$subscriber->id}/reveal")->assertRedirect('/login');
    }
}
