<?php

namespace Tests\Feature\Api;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RateLimitApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_exceeding_the_tokens_per_minute_limit_returns_429_with_headers(): void
    {
        $user = User::factory()->create(['email_verified_at' => now()]);
        $newToken = $user->createToken('limited', ['*']);

        // A tight per-minute cap so the second request in this test trips it,
        // without needing to fire 60 real requests.
        $newToken->accessToken->forceFill(['rate_limit_per_minute' => 1])->save();

        $headers = ['Authorization' => 'Bearer '.$newToken->plainTextToken];

        $this->getJson('/api/v1/short-links', $headers)->assertOk();

        $response = $this->getJson('/api/v1/short-links', $headers);

        $response->assertStatus(429);
        $this->assertTrue($response->headers->has('X-RateLimit-Limit'));
        $this->assertTrue($response->headers->has('Retry-After'));
    }

    public function test_a_token_without_a_configured_limit_falls_back_to_the_default(): void
    {
        $user = User::factory()->create(['email_verified_at' => now()]);
        $token = $user->createToken('default-limits', ['*']);

        $this->assertNull($token->accessToken->rate_limit_per_minute);
        $this->assertNull($token->accessToken->rate_limit_per_day);

        $headers = ['Authorization' => 'Bearer '.$token->plainTextToken];

        $this->getJson('/api/v1/short-links', $headers)->assertOk();
    }
}
