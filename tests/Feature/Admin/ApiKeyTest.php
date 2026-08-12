<?php

namespace Tests\Feature\Admin;

use App\Models\PersonalAccessToken;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ApiKeyTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        return User::factory()->create(['email_verified_at' => now(), 'role' => 'admin']);
    }

    public function test_the_index_requires_authentication(): void
    {
        $this->get('/admin/api-keys')->assertRedirect('/login');
    }

    public function test_a_non_admin_cannot_reach_the_index(): void
    {
        $user = User::factory()->create(['email_verified_at' => now()]);

        $this->actingAs($user)->get('/admin/api-keys')->assertForbidden();
    }

    public function test_creating_a_key_returns_the_plaintext_token_once_via_flash(): void
    {
        $admin = $this->admin();

        $response = $this->actingAs($admin)->post('/admin/api-keys', [
            'name' => 'My integration',
            'rate_limit_per_minute' => 30,
            'rate_limit_per_day' => 500,
        ]);

        $response->assertRedirect('/admin/api-keys');
        $response->assertSessionHas('flash.type', 'success');
        $response->assertSessionHas('flash.token');

        $plaintext = session('flash')['token'];
        $this->assertIsString($plaintext);
        $this->assertStringContainsString('|', $plaintext);

        $token = PersonalAccessToken::where('tokenable_id', $admin->id)->first();
        $this->assertSame('My integration', $token->name);
        $this->assertSame(30, $token->rate_limit_per_minute);
        $this->assertSame(500, $token->rate_limit_per_day);
    }

    public function test_created_keys_default_to_null_rate_limits_when_not_given(): void
    {
        $admin = $this->admin();

        $this->actingAs($admin)->post('/admin/api-keys', ['name' => 'No overrides'])
            ->assertRedirect('/admin/api-keys');

        $token = PersonalAccessToken::first();
        $this->assertNull($token->rate_limit_per_minute);
        $this->assertNull($token->rate_limit_per_day);
    }

    public function test_the_index_lists_the_acting_admins_keys(): void
    {
        $admin = $this->admin();
        $other = $this->admin();

        $admin->createToken('mine', ['*']);
        $other->createToken('not mine', ['*']);

        // X-Inertia makes this a "subsequent navigation" Inertia request, so
        // the response is plain page-data JSON rather than the full HTML
        // shell -- avoids needing a built resources/js/Pages/Admin/ApiKeys
        // asset, which is out of scope for this backend-only pass. The
        // version must match what Inertia computes server-side (a hash of
        // the manifest file), or it 409s asking for a full reload instead.
        // This also means the usual ->assertInertia() helper doesn't apply
        // (it expects a rendered Blade view, not a raw JSON response) -- we
        // assert on $response->json() directly instead, same as
        // MediaItemTest.
        $response = $this->actingAs($admin)->get('/admin/api-keys', [
            'X-Inertia' => 'true',
            'X-Inertia-Version' => hash_file('xxh128', public_path('build/manifest.json')),
        ]);

        $response->assertOk();
        $response->assertJson([
            'component' => 'Admin/ApiKeys/Index',
        ]);
        $this->assertCount(1, $response->json('props.tokens'));
        $this->assertSame('mine', $response->json('props.tokens.0.name'));
    }

    public function test_an_admin_can_revoke_their_own_key(): void
    {
        $admin = $this->admin();
        $newToken = $admin->createToken('revoke-me', ['*']);

        $this->actingAs($admin)
            ->delete('/admin/api-keys/'.$newToken->accessToken->id)
            ->assertRedirect('/admin/api-keys');

        $this->assertDatabaseMissing('personal_access_tokens', ['id' => $newToken->accessToken->id]);
    }

    public function test_an_admin_cannot_revoke_another_admins_key(): void
    {
        $admin = $this->admin();
        $other = $this->admin();
        $newToken = $other->createToken('not-yours', ['*']);

        $this->actingAs($admin)
            ->delete('/admin/api-keys/'.$newToken->accessToken->id)
            ->assertNotFound();

        $this->assertDatabaseHas('personal_access_tokens', ['id' => $newToken->accessToken->id]);
    }
}
