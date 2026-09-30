<?php

namespace Tests\Feature\Api;

use App\Models\ShortLink;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class ApiSecurityTest extends TestCase
{
    use RefreshDatabase;

    #[DataProvider('restrictedActions')]
    public function test_scoped_keys_cannot_perform_an_ungranted_action(string $method, string $path, array $data): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $link = ShortLink::create(['destination_url' => 'https://example.com/private', 'user_id' => $admin->id]);
        $token = $admin->createToken('create-only', ['short-links:create']);
        $this->withToken($token->plainTextToken)->json($method, str_replace('{code}', $link->code, $path), $data)->assertForbidden();
        $this->assertTrue($link->fresh()->is_active);
    }

    public static function restrictedActions(): array
    {
        return [
            ['GET', '/api/v1/short-links', []],
            ['GET', '/api/v1/short-links/{code}', []],
            ['PATCH', '/api/v1/short-links/{code}/deactivate', []],
            ['DELETE', '/api/v1/short-links/{code}', []],
            ['POST', '/api/v1/qr-codes', ['content' => 'https://example.com']],
        ];
    }

    #[DataProvider('allowedActions')]
    public function test_each_capability_allows_its_intended_action(string $scope, string $method, string $path, array $data, int $status): void
    {
        $user = User::factory()->create();
        $link = ShortLink::create(['destination_url' => 'https://example.com/owned', 'user_id' => $user->id]);
        $token = $user->createToken('scoped', [$scope]);
        $this->withToken($token->plainTextToken)->json($method, str_replace('{code}', $link->code, $path), $data)->assertStatus($status);
    }

    public static function allowedActions(): array
    {
        return [
            ['short-links:create', 'POST', '/api/v1/short-links', ['destination_url' => 'https://example.com/new'], 201],
            ['short-links:read', 'GET', '/api/v1/short-links', [], 200],
            ['short-links:read', 'GET', '/api/v1/short-links/{code}', [], 200],
            ['short-links:manage', 'PATCH', '/api/v1/short-links/{code}/deactivate', [], 200],
            ['short-links:manage', 'DELETE', '/api/v1/short-links/{code}', [], 204],
            ['qr-codes:create', 'POST', '/api/v1/qr-codes', ['content' => 'https://example.com'], 200],
        ];
    }

    public function test_another_owners_link_metadata_is_private_even_with_read_scope(): void
    {
        $link = ShortLink::create(['destination_url' => 'https://example.com/private', 'title' => 'Private campaign']);
        $token = User::factory()->create()->createToken('reader', ['short-links:read']);
        $this->withToken($token->plainTextToken)->getJson('/api/v1/short-links/'.$link->code)->assertForbidden();
    }

    public function test_an_admin_with_read_scope_can_read_another_owners_link(): void
    {
        $link = ShortLink::create(['destination_url' => 'https://example.com/private']);
        $token = User::factory()->create(['role' => 'admin'])->createToken('reader', ['short-links:read']);
        $this->withToken($token->plainTextToken)->getJson('/api/v1/short-links/'.$link->code)->assertOk();
    }

    public function test_creating_an_already_shortened_destination_cannot_disclose_or_claim_another_owners_metadata(): void
    {
        $other = User::factory()->create();
        $existing = ShortLink::create(['destination_url' => 'https://example.com/shared', 'title' => 'Private campaign', 'user_id' => $other->id, 'expires_at' => now()->addDay()]);
        $caller = User::factory()->create(['role' => 'admin']);
        $token = $caller->createToken('creator', ['short-links:create']);
        $response = $this->withToken($token->plainTextToken)->postJson('/api/v1/short-links', ['destination_url' => 'https://example.com/shared', 'title' => 'My own link'])
            ->assertCreated()->assertJson(['title' => 'My own link', 'expires_at' => null]);
        $this->assertNotSame($existing->code, $response->json('code'));
        $created = ShortLink::where('code', $response->json('code'))->firstOrFail();
        $this->assertSame($caller->id, $created->user_id);
        $this->assertSame('Private campaign', $existing->fresh()->title);
        $this->assertSame($other->id, $existing->fresh()->user_id);
    }

    public function test_empty_scope_token_cannot_create_links(): void
    {
        $token = User::factory()->create()->createToken('no-rights', []);
        $this->withToken($token->plainTextToken)->postJson('/api/v1/short-links', ['destination_url' => 'https://example.com'])->assertForbidden();
        $this->assertSame(0, ShortLink::count());
    }

    public function test_a_create_only_key_cannot_reuse_its_owners_existing_private_metadata(): void
    {
        $owner = User::factory()->create(['role' => 'admin']);
        $existing = ShortLink::create(['destination_url' => 'https://example.com/private', 'title' => 'Private campaign', 'user_id' => $owner->id, 'expires_at' => now()->addDay()]);
        $token = $owner->createToken('creator', ['short-links:create']);
        $response = $this->withToken($token->plainTextToken)->postJson('/api/v1/short-links', ['destination_url' => 'https://example.com/private'])
            ->assertCreated()->assertJson(['title' => null, 'expires_at' => null]);
        $this->assertNotSame($existing->code, $response->json('code'));
        $this->assertSame(2, ShortLink::count());
    }

    public function test_browser_authentication_cannot_bypass_api_key_capabilities(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $this->actingAs($admin)->getJson('/api/v1/short-links')->assertForbidden();
    }

    public function test_a_revoked_legacy_key_cannot_authenticate(): void
    {
        $token = User::factory()->create()->createToken('legacy', ['*']);
        $token->accessToken->delete();
        $this->withToken($token->plainTextToken)->getJson('/api/v1/short-links')->assertUnauthorized();
    }

    public function test_successful_api_use_records_the_keys_last_used_time(): void
    {
        $token = User::factory()->create()->createToken('reader', ['short-links:read']);
        $this->withToken($token->plainTextToken)->getJson('/api/v1/short-links')->assertOk();
        $this->assertNotNull($token->accessToken->fresh()->last_used_at);
    }

    public function test_expired_key_cannot_authenticate(): void
    {
        $token = User::factory()->create()->createToken('expired', ['short-links:read'], now()->subMinute());
        $this->withToken($token->plainTextToken)->getJson('/api/v1/short-links')->assertUnauthorized();
    }
}
