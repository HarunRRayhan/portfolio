<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class SocialLoginTest extends TestCase
{
    use RefreshDatabase;

    public function test_github_redirect_includes_the_intended_return_url(): void
    {
        config()->set('services.github', [
            'client_id' => 'github-client-id',
            'client_secret' => 'github-client-secret',
            'redirect' => 'http://localhost/auth/github/callback',
        ]);

        $response = $this->get('/auth/github?redirect='.urlencode('http://localhost/blog/example#discussion'));

        $response->assertRedirect();

        $location = $response->headers->get('Location');
        $this->assertNotFalse($location);

        $url = parse_url($location);
        $this->assertSame('github.com', $url['host'] ?? null);
        $this->assertSame('/login/oauth/authorize', $url['path'] ?? null);

        parse_str($url['query'] ?? '', $query);

        $this->assertSame('github-client-id', $query['client_id'] ?? null);
        $this->assertSame('read:user user:email', $query['scope'] ?? null);
        $this->assertSame('http://localhost/auth/github/callback', $query['redirect_uri'] ?? null);
        $this->assertArrayHasKey('state', $query);
    }

    public function test_github_callback_creates_or_logs_in_the_user(): void
    {
        config()->set('app.url', 'http://localhost');
        config()->set('services.github', [
            'client_id' => 'github-client-id',
            'client_secret' => 'github-client-secret',
            'redirect' => 'http://localhost/auth/github/callback',
        ]);

        Http::fake([
            'https://github.com/login/oauth/access_token' => Http::response([
                'access_token' => 'github-access-token',
                'scope' => 'read:user user:email',
                'token_type' => 'bearer',
            ]),
            'https://api.github.com/user' => Http::response([
                'id' => 12345,
                'name' => 'Harun Rayhan',
                'email' => null,
                'avatar_url' => 'https://avatars.githubusercontent.com/u/12345?v=4',
            ]),
            'https://api.github.com/user/emails' => Http::response([
                [
                    'email' => 'harun@example.com',
                    'primary' => true,
                    'verified' => true,
                ],
            ]),
        ]);

        $redirectResponse = $this->get('/auth/github?redirect='.urlencode('http://localhost/blog/example#discussion'));
        $redirectLocation = $redirectResponse->headers->get('Location');
        $this->assertNotFalse($redirectLocation);

        $redirectUrl = parse_url($redirectLocation);
        parse_str($redirectUrl['query'] ?? '', $redirectQuery);

        $callbackResponse = $this->get('/auth/github/callback?code=test-code&state='.($redirectQuery['state'] ?? ''));

        $callbackResponse->assertRedirect(route('passkeys.prompt'));
        $this->assertSame('http://localhost/blog/example#discussion', session('passkey_prompt.redirect_to'));
        $this->assertAuthenticated();

        $user = User::query()->where('email', 'harun@example.com')->first();
        $this->assertNotNull($user);
        $this->assertSame('Harun Rayhan', $user->name);
        $this->assertSame('github', $user->provider_name);
        $this->assertSame('12345', (string) $user->provider_id);
        $this->assertSame('https://avatars.githubusercontent.com/u/12345?v=4', $user->avatar_url);
    }

    public function test_returning_social_user_goes_straight_to_the_redirect_target(): void
    {
        config()->set('app.url', 'http://localhost');
        config()->set('services.github', [
            'client_id' => 'id', 'client_secret' => 'secret', 'redirect' => 'http://localhost/auth/github/callback',
        ]);
        User::factory()->create(['email' => 'harun@example.com', 'provider_name' => 'github', 'provider_id' => '12345']);
        Http::fake([
            'https://github.com/login/oauth/access_token' => Http::response(['access_token' => 'tok']),
            'https://api.github.com/user' => Http::response(['id' => 12345, 'name' => 'Harun']),
            'https://api.github.com/user/emails' => Http::response([['email' => 'harun@example.com', 'primary' => true, 'verified' => true]]),
        ]);

        $this->withSession(['social_login.state.github' => 's', 'social_login.redirect_to' => '/blog/example'])
            ->get('/auth/github/callback?code=c&state=s')
            ->assertRedirect('/blog/example');
        $this->assertAuthenticated();
    }
}
