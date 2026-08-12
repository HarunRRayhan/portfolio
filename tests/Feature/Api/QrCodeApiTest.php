<?php

namespace Tests\Feature\Api;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class QrCodeApiTest extends TestCase
{
    use RefreshDatabase;

    /** @return array<string, string> */
    private function authHeaders(): array
    {
        $token = User::factory()->create(['email_verified_at' => now()])->createToken('test-token', ['*']);

        return ['Authorization' => 'Bearer '.$token->plainTextToken];
    }

    public function test_unauthenticated_requests_are_rejected(): void
    {
        $this->postJson('/api/v1/qr-codes', ['content' => 'https://example.com'])->assertUnauthorized();
    }

    public function test_it_returns_a_valid_data_uri_by_default(): void
    {
        $response = $this->postJson('/api/v1/qr-codes', ['content' => 'https://example.com'], $this->authHeaders())
            ->assertOk()
            ->assertJsonStructure(['qr_code']);

        $this->assertStringStartsWith('data:image/png;base64,', $response->json('qr_code'));

        [, $base64] = explode(',', $response->json('qr_code'), 2);
        $bytes = base64_decode($base64, true);

        $this->assertNotFalse($bytes);
        $this->assertStringStartsWith("\x89PNG", $bytes);
    }

    public function test_the_png_format_returns_raw_png_bytes(): void
    {
        $response = $this->postJson('/api/v1/qr-codes?format=png', ['content' => 'https://example.com'], $this->authHeaders());

        $response->assertOk();
        $this->assertSame('image/png', $response->headers->get('Content-Type'));
        $this->assertStringStartsWith("\x89PNG", $response->getContent());
    }

    public function test_content_is_required(): void
    {
        $this->postJson('/api/v1/qr-codes', [], $this->authHeaders())->assertStatus(422);
    }
}
