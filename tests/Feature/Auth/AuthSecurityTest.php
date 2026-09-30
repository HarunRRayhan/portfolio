<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\URL;
use Illuminate\Testing\TestResponse;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class AuthSecurityTest extends TestCase
{
    use RefreshDatabase;

    public function test_registration_does_not_grant_admin_for_a_claimed_owner_email(): void
    {
        Notification::fake();
        config()->set('auth.super_admin_emails', ['owner@example.com']);

        $this->post('/register', [
            'name' => 'Claimant', 'email' => 'owner@example.com',
            'password' => 'password', 'password_confirmation' => 'password',
        ])->assertRedirect('/blog');

        $user = User::where('email', 'owner@example.com')->firstOrFail();
        $this->assertFalse($user->isAdmin());
        $this->assertFalse($user->hasVerifiedEmail());
        Notification::assertSentTo($user, VerifyEmail::class);
    }

    public function test_unverified_admin_must_verify_before_accessing_dashboard(): void
    {
        $user = User::factory()->unverified()->create(['role' => 'admin']);
        $this->actingAs($user)->get('/admin/dashboard')->assertRedirect('/verify-email');
    }

    public function test_google_cannot_merge_into_an_existing_password_account(): void
    {
        $user = User::factory()->unverified()->create(['email' => 'owner@example.com']);
        $password = $user->password;
        config()->set('auth.super_admin_emails', ['owner@example.com']);
        $this->fakeGoogle(['sub' => 'new-provider-id', 'email' => $user->email, 'email_verified' => true]);

        $this->googleCallback()->assertRedirect('/login')->assertSessionHas('status');

        $this->assertGuest();
        $user->refresh();
        $this->assertNull($user->provider_id);
        $this->assertSame($password, $user->password);
        $this->assertTrue(Hash::check('password', $user->password));
        $this->assertFalse($user->hasVerifiedEmail());
        $this->assertFalse($user->isAdmin());
    }

    public function test_google_cannot_replace_a_different_linked_identity_with_the_same_email(): void
    {
        $user = User::factory()->create(['email' => 'owner@example.com', 'provider_name' => 'google', 'provider_id' => 'real-owner']);
        $this->fakeGoogle(['sub' => 'impostor', 'email' => $user->email, 'email_verified' => true]);
        $this->googleCallback()->assertRedirect('/login');
        $this->assertGuest();
        $this->assertSame('real-owner', $user->fresh()->provider_id);
    }

    public function test_linked_identity_can_log_in_with_a_changed_verified_email(): void
    {
        $user = User::factory()->create(['email' => 'old@example.com', 'provider_name' => 'google', 'provider_id' => 'owner-id', 'role' => 'admin']);
        $this->fakeGoogle(['sub' => 'owner-id', 'email' => 'new@example.com', 'email_verified' => true]);
        $this->googleCallback()->assertRedirect('/admin/dashboard');
        $this->assertAuthenticatedAs($user);
        $this->assertSame('new@example.com', $user->fresh()->email);
        $this->assertSame(1, User::count());
    }

    public function test_linked_identity_cannot_claim_another_accounts_email(): void
    {
        $user = User::factory()->create(['email' => 'old@example.com', 'provider_name' => 'google', 'provider_id' => 'owner-id']);
        $other = User::factory()->create(['email' => 'taken@example.com']);
        $this->fakeGoogle(['sub' => 'owner-id', 'email' => $other->email, 'email_verified' => true]);
        $this->googleCallback()->assertRedirect('/login');
        $this->assertGuest();
        $this->assertSame('old@example.com', $user->fresh()->email);
        $this->assertNull($other->fresh()->provider_id);
    }

    #[DataProvider('untrustedGoogleProfiles')]
    public function test_google_requires_a_verified_email_and_stable_identity(array $profile): void
    {
        config()->set('auth.super_admin_emails', ['owner@example.com']);
        $this->fakeGoogle($profile);
        $this->googleCallback()->assertRedirect('/login')->assertSessionHas('status');
        $this->assertGuest();
        $this->assertSame(0, User::count());
    }

    public static function untrustedGoogleProfiles(): array
    {
        return [
            'unverified' => [['sub' => 'id', 'email' => 'owner@example.com', 'email_verified' => false]],
            'missing verification' => [['sub' => 'id', 'email' => 'owner@example.com']],
            'string false' => [['sub' => 'id', 'email' => 'owner@example.com', 'email_verified' => 'false']],
            'missing id' => [['email' => 'owner@example.com', 'email_verified' => true]],
        ];
    }

    public function test_verified_new_google_owner_can_receive_admin_access(): void
    {
        config()->set('auth.super_admin_emails', ['owner@example.com']);
        $this->fakeGoogle(['sub' => 'owner-id', 'email' => 'owner@example.com', 'email_verified' => true]);
        $this->googleCallback()->assertRedirect('/admin/dashboard');
        $user = User::where('email', 'owner@example.com')->firstOrFail();
        $this->assertAuthenticatedAs($user);
        $this->assertTrue($user->isAdmin());
        $this->assertTrue($user->hasVerifiedEmail());
    }

    public function test_github_public_email_is_not_proof_of_verified_ownership(): void
    {
        config()->set('services.github', ['client_id' => 'test', 'client_secret' => 'test', 'redirect' => 'http://localhost/auth/github/callback']);
        Http::fake([
            'https://github.com/login/oauth/access_token' => Http::response(['access_token' => 'test']),
            'https://api.github.com/user' => Http::response(['id' => 123, 'name' => 'Test', 'email' => 'owner@example.com']),
            'https://api.github.com/user/emails' => Http::response([['email' => 'owner@example.com', 'primary' => true, 'verified' => false]]),
        ]);
        $this->withSession(['social_login.state.github' => 'test-state'])
            ->get('/auth/github/callback?code=test&state=test-state')->assertRedirect('/login');
        $this->assertGuest();
        $this->assertSame(0, User::count());
    }

    #[DataProvider('unsafeRedirectTargets')]
    public function test_social_callback_rejects_unsafe_return_urls(string $target): void
    {
        config()->set('app.url', 'http://localhost');
        $this->fakeGoogle(['sub' => 'id', 'email' => 'commenter@example.com', 'email_verified' => true]);
        $this->withSession(['social_login.redirect_to' => $target]);
        $this->googleCallback()->assertRedirect('/blog');
    }

    #[DataProvider('unsafeRedirectTargets')]
    public function test_password_login_rejects_unsafe_intended_urls(string $target): void
    {
        config()->set('app.url', 'http://localhost');
        $user = User::factory()->create();
        $this->withSession(['url.intended' => $target])->post('/login', ['email' => $user->email, 'password' => 'password'])
            ->assertRedirect('/blog');
    }

    public static function unsafeRedirectTargets(): array
    {
        return array_map(fn ($target) => [$target], [
            '//evil.example/path', '/\\evil.example/path', "/blog\r\nX-Test: injected",
            'http://evil.example/path', 'https://localhost/blog', 'http://localhost:9999/blog',
            'ftp://localhost/path', 'http://user@localhost/path', '/%5Cevil.example', '/%2Fevil.example',
        ]);
    }

    public function test_password_login_preserves_an_internal_intended_url(): void
    {
        $user = User::factory()->create();
        $this->withSession(['url.intended' => '/blog/example#discussion'])->post('/login', ['email' => $user->email, 'password' => 'password'])
            ->assertRedirect('/blog/example#discussion');
    }

    #[DataProvider('postAuthenticationRoutes')]
    public function test_authenticated_recovery_routes_reject_unsafe_intended_urls(string $route, string $method): void
    {
        $user = User::factory()->create(['role' => 'admin']);
        $this->actingAs($user)->withSession(['url.intended' => '//evil.example']);
        $response = $method === 'get' ? $this->get($route) : $this->post($route, ['password' => 'password']);
        $response->assertRedirect('/admin/dashboard');
    }

    public static function postAuthenticationRoutes(): array
    {
        return [['/verify-email', 'get'], ['/email/verification-notification', 'post'], ['/confirm-password', 'post']];
    }

    public function test_verification_completion_rejects_an_unsafe_intended_url(): void
    {
        $user = User::factory()->unverified()->create(['role' => 'admin']);
        $url = URL::temporarySignedRoute('verification.verify', now()->addMinutes(5), ['id' => $user->id, 'hash' => sha1($user->email)]);
        $this->actingAs($user)->withSession(['url.intended' => '//evil.example'])->get($url)
            ->assertRedirect('/admin/dashboard?verified=1');
    }

    public function test_a_provider_identity_cannot_belong_to_two_accounts(): void
    {
        User::factory()->create(['provider_name' => 'google', 'provider_id' => 'unique-id']);
        $this->expectException(UniqueConstraintViolationException::class);
        User::factory()->create(['provider_name' => 'google', 'provider_id' => 'unique-id']);
    }

    public function test_concurrent_social_identity_creation_returns_a_recoverable_error(): void
    {
        $this->fakeGoogle(['sub' => 'racing-id', 'email' => 'owner@example.com', 'email_verified' => true]);
        Event::listen('eloquent.creating: '.User::class, function (User $user) {
            if ($user->provider_id === 'racing-id') {
                DB::table('users')->insert([
                    'name' => 'Existing identity', 'email' => 'previous@example.com',
                    'password' => Hash::make('existing-password'), 'provider_name' => 'google', 'provider_id' => 'racing-id',
                ]);
            }
        });

        try {
            $this->googleCallback()->assertRedirect('/login')->assertSessionHas('status');
            $this->assertGuest();
            $this->assertSame(1, User::count());
            $this->assertTrue(Hash::check('existing-password', User::firstOrFail()->password));
        } finally {
            Event::forget('eloquent.creating: '.User::class);
        }
    }

    public function test_same_email_with_different_casing_cannot_merge_accounts(): void
    {
        $user = User::factory()->create(['email' => 'Owner@Example.com']);
        $this->fakeGoogle(['sub' => 'new-id', 'email' => 'owner@example.com', 'email_verified' => true]);
        $this->googleCallback()->assertRedirect('/login');
        $this->assertGuest();
        $this->assertNull($user->fresh()->provider_id);
    }

    public function test_unique_social_identity_allows_other_providers_and_password_accounts(): void
    {
        User::factory()->create(['provider_name' => 'google', 'provider_id' => '123']);
        User::factory()->create(['provider_name' => 'github', 'provider_id' => '123']);
        User::factory()->count(2)->create();
        $this->assertSame(4, User::count());
    }

    public function test_identity_migration_preserves_duplicate_legacy_accounts_for_review(): void
    {
        $migration = require database_path('migrations/2026_09_30_000001_add_unique_social_identity_to_users_table.php');
        $migration->down();
        $first = User::factory()->create(['provider_name' => 'google', 'provider_id' => 'legacy-id']);
        $second = User::factory()->create(['provider_name' => 'google', 'provider_id' => 'legacy-id']);
        $password = $first->password;

        try {
            try {
                $migration->up();
                $this->fail('Duplicate legacy identities must require review.');
            } catch (\RuntimeException $exception) {
                $this->assertStringContainsString('reviewed', $exception->getMessage());
            }
            $this->assertSame(2, User::count());
            $this->assertSame($password, $first->fresh()->password);
            $this->assertSame('legacy-id', $second->fresh()->provider_id);
        } finally {
            $second->delete();
            $migration->up();
        }
    }

    public function test_internal_intended_url_preserves_encoded_query_spaces(): void
    {
        $user = User::factory()->create();
        $this->withSession(['url.intended' => '/blog?search=hello%20world'])->post('/login', ['email' => $user->email, 'password' => 'password'])
            ->assertRedirect('/blog?search=hello%20world');
    }

    #[DataProvider('postAuthenticationRoutes')]
    public function test_verified_commenter_recovery_routes_return_to_the_blog(string $route, string $method): void
    {
        $user = User::factory()->create(['role' => 'commenter']);
        $this->actingAs($user);
        $response = $method === 'get' ? $this->get($route) : $this->post($route, ['password' => 'password']);
        $response->assertRedirect('/blog');
    }

    public function test_verified_commenter_keeps_an_internal_intended_url_after_verification(): void
    {
        $user = User::factory()->unverified()->create(['role' => 'commenter']);
        $url = URL::temporarySignedRoute('verification.verify', now()->addMinutes(5), ['id' => $user->id, 'hash' => sha1($user->email)]);
        $this->actingAs($user)->withSession(['url.intended' => '/blog/example#discussion'])->get($url)
            ->assertRedirect('/blog/example#discussion');
        $this->assertTrue($user->fresh()->hasVerifiedEmail());
    }

    private function fakeGoogle(array $profile): void
    {
        config()->set('services.google', ['client_id' => 'test', 'client_secret' => 'test', 'redirect' => 'http://localhost/auth/google/callback']);
        Http::fake([
            'https://oauth2.googleapis.com/token' => Http::response(['access_token' => 'test']),
            'https://openidconnect.googleapis.com/v1/userinfo' => Http::response(['name' => 'Test User'] + $profile),
        ]);
    }

    private function googleCallback(): TestResponse
    {
        return $this->withSession(['social_login.state.google' => 'test-state'])
            ->get('/auth/google/callback?code=test&state=test-state');
    }
}
