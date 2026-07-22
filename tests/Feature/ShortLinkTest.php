<?php

namespace Tests\Feature;

use App\Models\ShortLink;
use App\Models\ShortLinkClick;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ShortLinkTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        return User::factory()->create([
            'email_verified_at' => now(),
            'role' => 'admin',
        ]);
    }

    public function test_visiting_a_short_link_redirects_and_records_a_click(): void
    {
        $link = ShortLink::create(['destination_url' => 'https://example.com/target']);

        $this->get("/s/{$link->code}")
            ->assertRedirect('https://example.com/target')
            ->assertStatus(302);

        $this->assertDatabaseCount('short_link_clicks', 1);
        $this->assertSame($link->id, ShortLinkClick::first()->short_link_id);
    }

    public function test_an_inactive_link_404s(): void
    {
        $link = ShortLink::create([
            'destination_url' => 'https://example.com/target',
            'is_active' => false,
        ]);

        $this->get("/s/{$link->code}")->assertNotFound();
        $this->assertDatabaseCount('short_link_clicks', 0);
    }

    public function test_an_expired_link_404s(): void
    {
        $link = ShortLink::create([
            'destination_url' => 'https://example.com/target',
            'expires_at' => now()->subDay(),
        ]);

        $this->get("/s/{$link->code}")->assertNotFound();
        $this->assertDatabaseCount('short_link_clicks', 0);
    }

    public function test_an_unknown_code_404s(): void
    {
        $this->get('/s/does-not-exist')->assertNotFound();
    }

    public function test_a_custom_code_round_trips(): void
    {
        $this->actingAs($this->admin())
            ->post('/admin/short', [
                'destination_url' => 'https://example.com/target',
                'code' => 'my-code',
                'is_active' => true,
            ])
            ->assertRedirect('/admin/short');

        $this->assertDatabaseHas('short_links', ['code' => 'my-code']);

        $this->get('/s/my-code')->assertRedirect('https://example.com/target');
    }

    public function test_a_duplicate_custom_code_is_rejected(): void
    {
        ShortLink::create(['destination_url' => 'https://example.com/one', 'code' => 'taken']);

        $this->actingAs($this->admin())
            ->post('/admin/short', [
                'destination_url' => 'https://example.com/two',
                'code' => 'taken',
                'is_active' => true,
            ])
            ->assertSessionHasErrors('code');
    }

    public function test_a_blank_code_is_auto_generated(): void
    {
        $link = ShortLink::create(['destination_url' => 'https://example.com/target']);

        $this->assertNotEmpty($link->code);
        $this->assertSame(7, strlen($link->code));
    }

    public function test_admin_routes_require_authentication(): void
    {
        $this->get('/admin/short')->assertRedirect('/login');
    }
}
