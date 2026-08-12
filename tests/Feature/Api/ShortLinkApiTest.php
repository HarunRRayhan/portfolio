<?php

namespace Tests\Feature\Api;

use App\Models\ShortLink;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Tests\TestCase;

class ShortLinkApiTest extends TestCase
{
    use RefreshDatabase;

    private function user(): User
    {
        return User::factory()->create(['email_verified_at' => now()]);
    }

    private function admin(): User
    {
        return User::factory()->create(['email_verified_at' => now(), 'role' => 'admin']);
    }

    /**
     * A real Sanctum token (not Sanctum::actingAs's mock) so the api-key
     * rate limiter -- which reads real columns off the token model on
     * every /api/v1 request -- has a genuine row to read.
     *
     * Sanctum's guard is a RequestGuard, which caches the first user it
     * resolves for the lifetime of the guard instance. Laravel's test
     * client reuses that same instance across every call within one test
     * method, so a second request authenticating as a different user
     * would otherwise silently resolve back to whoever was cached first.
     * Forgetting guards here -- right before each header set is built,
     * i.e. right before the next request goes out -- forces a fresh
     * resolution per request.
     *
     * @return array<string, string>
     */
    private function authHeaders(User $user): array
    {
        Auth::forgetGuards();

        $token = $user->createToken('test-token', ['*']);

        return ['Authorization' => 'Bearer '.$token->plainTextToken];
    }

    public function test_unauthenticated_requests_are_rejected(): void
    {
        $this->getJson('/api/v1/short-links')->assertUnauthorized();
        $this->postJson('/api/v1/short-links', ['destination_url' => 'https://example.com'])->assertUnauthorized();
    }

    public function test_creating_a_short_link_returns_the_expected_shape(): void
    {
        $response = $this->postJson('/api/v1/short-links', [
            'destination_url' => 'https://example.com/target',
            'title' => 'My link',
        ], $this->authHeaders($this->user()));

        $response->assertCreated()
            ->assertJsonStructure(['code', 'short_url', 'destination_url', 'title', 'is_active', 'expires_at', 'qr_code_url'])
            ->assertJson([
                'destination_url' => 'https://example.com/target',
                'title' => 'My link',
                'is_active' => true,
                'expires_at' => null,
            ]);
    }

    public function test_creating_the_same_url_twice_reuses_the_same_code_and_does_not_duplicate(): void
    {
        $headers = $this->authHeaders($this->user());

        $first = $this->postJson('/api/v1/short-links', ['destination_url' => 'https://example.com/dedup'], $headers)
            ->assertCreated()->json();

        $second = $this->postJson('/api/v1/short-links', ['destination_url' => 'https://example.com/dedup'], $headers)
            ->assertCreated()->json();

        $this->assertSame($first['code'], $second['code']);
        $this->assertSame(1, ShortLink::count());
    }

    public function test_the_token_owner_is_stamped_on_first_creation_only(): void
    {
        $owner = $this->user();

        $this->postJson('/api/v1/short-links', ['destination_url' => 'https://example.com/owner-stamp'], $this->authHeaders($owner))
            ->assertCreated();

        $link = ShortLink::where('destination_url', 'https://example.com/owner-stamp')->first();
        $this->assertSame($owner->id, $link->user_id);

        $other = $this->user();

        $this->postJson('/api/v1/short-links', ['destination_url' => 'https://example.com/owner-stamp'], $this->authHeaders($other))
            ->assertCreated();

        $link->refresh();
        $this->assertSame($owner->id, $link->user_id);
    }

    public function test_a_non_http_destination_is_rejected(): void
    {
        $this->postJson('/api/v1/short-links', ['destination_url' => 'mailto:harun@harun.dev'], $this->authHeaders($this->user()))
            ->assertStatus(422);
    }

    public function test_index_lists_only_the_callers_own_links(): void
    {
        $owner = $this->user();
        $stranger = $this->user();

        ShortLink::create(['destination_url' => 'https://example.com/mine', 'user_id' => $owner->id]);
        ShortLink::create(['destination_url' => 'https://example.com/not-mine', 'user_id' => $stranger->id]);

        $response = $this->getJson('/api/v1/short-links', $this->authHeaders($owner))->assertOk();
        $urls = collect($response->json('data'))->pluck('destination_url')->all();

        $this->assertContains('https://example.com/mine', $urls);
        $this->assertNotContains('https://example.com/not-mine', $urls);
    }

    public function test_index_shows_every_link_for_an_admin_key(): void
    {
        $owner = $this->user();
        $admin = $this->admin();

        ShortLink::create(['destination_url' => 'https://example.com/mine', 'user_id' => $owner->id]);
        ShortLink::create(['destination_url' => 'https://example.com/legacy']);

        $response = $this->getJson('/api/v1/short-links', $this->authHeaders($admin))->assertOk();
        $urls = collect($response->json('data'))->pluck('destination_url')->all();

        $this->assertContains('https://example.com/mine', $urls);
        $this->assertContains('https://example.com/legacy', $urls);
    }

    public function test_show_includes_click_count(): void
    {
        $owner = $this->user();
        $link = ShortLink::create(['destination_url' => 'https://example.com/clicks', 'user_id' => $owner->id]);
        $link->clicks()->create(['ip_address' => '127.0.0.1']);
        $link->clicks()->create(['ip_address' => '127.0.0.2']);

        $this->getJson("/api/v1/short-links/{$link->code}", $this->authHeaders($owner))
            ->assertOk()
            ->assertJson(['click_count' => 2]);
    }

    public function test_show_404s_for_an_unknown_code(): void
    {
        $this->getJson('/api/v1/short-links/does-not-exist', $this->authHeaders($this->user()))
            ->assertNotFound();
    }

    public function test_owner_can_deactivate_their_own_link(): void
    {
        $owner = $this->user();
        $link = ShortLink::create(['destination_url' => 'https://example.com/deact', 'user_id' => $owner->id]);

        $this->patchJson("/api/v1/short-links/{$link->code}/deactivate", [], $this->authHeaders($owner))
            ->assertOk()
            ->assertJson(['is_active' => false]);

        $this->assertFalse($link->fresh()->is_active);
    }

    public function test_a_non_owner_cannot_deactivate_someone_elses_link(): void
    {
        $owner = $this->user();
        $stranger = $this->user();
        $link = ShortLink::create(['destination_url' => 'https://example.com/deact2', 'user_id' => $owner->id]);

        $this->patchJson("/api/v1/short-links/{$link->code}/deactivate", [], $this->authHeaders($stranger))
            ->assertForbidden();
        $this->assertTrue($link->fresh()->is_active);
    }

    public function test_an_admin_can_deactivate_any_link(): void
    {
        $owner = $this->user();
        $admin = $this->admin();
        $link = ShortLink::create(['destination_url' => 'https://example.com/deact3', 'user_id' => $owner->id]);

        $this->patchJson("/api/v1/short-links/{$link->code}/deactivate", [], $this->authHeaders($admin))
            ->assertOk();
        $this->assertFalse($link->fresh()->is_active);
    }

    public function test_a_null_owner_link_is_admin_only(): void
    {
        $stranger = $this->user();
        $admin = $this->admin();
        $link = ShortLink::create(['destination_url' => 'https://example.com/legacy2']);

        $this->patchJson("/api/v1/short-links/{$link->code}/deactivate", [], $this->authHeaders($stranger))
            ->assertForbidden();

        $this->patchJson("/api/v1/short-links/{$link->code}/deactivate", [], $this->authHeaders($admin))
            ->assertOk();
    }

    public function test_owner_can_delete_their_own_link(): void
    {
        $owner = $this->user();
        $link = ShortLink::create(['destination_url' => 'https://example.com/del', 'user_id' => $owner->id]);

        $this->deleteJson("/api/v1/short-links/{$link->code}", [], $this->authHeaders($owner))
            ->assertNoContent();
        $this->assertDatabaseMissing('short_links', ['id' => $link->id]);
    }

    public function test_a_non_owner_cannot_delete_someone_elses_link(): void
    {
        $owner = $this->user();
        $stranger = $this->user();
        $link = ShortLink::create(['destination_url' => 'https://example.com/del2', 'user_id' => $owner->id]);

        $this->deleteJson("/api/v1/short-links/{$link->code}", [], $this->authHeaders($stranger))
            ->assertForbidden();
        $this->assertDatabaseHas('short_links', ['id' => $link->id]);
    }
}
