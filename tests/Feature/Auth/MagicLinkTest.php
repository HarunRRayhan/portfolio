<?php

namespace Tests\Feature\Auth;

use App\Mail\MagicLoginLinkMail;
use App\Models\MagicLoginToken;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Spatie\LaravelPasskeys\Models\Passkey;
use Tests\TestCase;

class MagicLinkTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config(['services.turnstile.secret_key' => 'secret', 'services.turnstile.site_key' => 'site']);
        Mail::fake();
    }

    private function turnstile(bool $ok = true): void
    {
        Http::fake(['challenges.cloudflare.com/*' => Http::response(['success' => $ok, 'hostname' => parse_url(config('app.url'), PHP_URL_HOST)])]);
    }

    private function send(string $email = 'new@example.com', array $extra = [])
    {
        return $this->post(route('magic-link.send'), ['email' => $email, 'cf-turnstile-response' => 'tok'] + $extra);
    }

    /** Create a token directly and return the plain value. */
    private function token(string $email = 'new@example.com', array $attrs = []): string
    {
        $plain = bin2hex(random_bytes(16));
        MagicLoginToken::create($attrs + [
            'email' => $email,
            'token_hash' => hash('sha256', $plain),
            'expires_at' => now()->addMinutes(15),
        ]);

        return $plain;
    }

    public function test_send_requires_valid_turnstile(): void
    {
        $this->turnstile(false);

        $this->send()->assertSessionHasErrors('email');

        Mail::assertNothingSent();
        $this->assertSame(0, MagicLoginToken::count());
    }

    public function test_send_disabled_when_turnstile_not_configured(): void
    {
        config(['services.turnstile.secret_key' => '']);
        $this->turnstile();

        $this->send()->assertSessionHasErrors(['email' => 'Email sign-in is temporarily unavailable.']);

        Mail::assertNothingSent();
    }

    public function test_send_sends_mail_and_stores_hashed_token(): void
    {
        $this->turnstile();
        $this->travelTo(now()->startOfSecond());

        $this->send();

        Mail::assertSent(MagicLoginLinkMail::class, fn ($m) => $m->hasTo('new@example.com'));
        $row = MagicLoginToken::sole();
        $this->assertSame(64, strlen($row->token_hash));
        $this->assertTrue($row->expires_at->equalTo(now()->addMinutes(15)));
    }

    public function test_send_response_is_identical_for_known_and_unknown_email(): void
    {
        $this->turnstile();
        User::factory()->create(['email' => 'known@example.com']);

        $msg = 'Check your inbox for a sign-in link. It expires in 15 minutes.';
        $a = $this->send('known@example.com');
        $a->assertSessionHas('status', $msg);
        $b = $this->send('unknown@example.com');
        $b->assertSessionHas('status', $msg);

        $this->assertSame($a->headers->get('Location'), $b->headers->get('Location'));
    }

    public function test_send_is_rate_limited_per_email(): void
    {
        $this->turnstile();

        foreach (range(1, 4) as $i) {
            $this->send('rate@example.com')->assertSessionHas('status', 'Check your inbox for a sign-in link. It expires in 15 minutes.');
        }

        Mail::assertSent(MagicLoginLinkMail::class, 3);
    }

    public function test_magic_link_creates_verified_commenter(): void
    {
        $plain = $this->token('Jane.Doe@example.com');

        $this->post(route('magic-link.consume', $plain))->assertRedirect(route('agreement.show'));

        $user = User::where('email', 'jane.doe@example.com')->sole();
        $this->assertSame('commenter', $user->role);
        $this->assertNotNull($user->email_verified_at);
        $this->assertSame('jane.doe', $user->name);
        $this->assertAuthenticatedAs($user);
    }

    public function test_magic_link_logs_in_existing_user_without_prompt_and_verifies(): void
    {
        $user = User::factory()->unverified()->create(['email' => 'old@example.com']);

        $this->post(route('magic-link.consume', $this->token('old@example.com')))->assertRedirect(route('blog.index', absolute: false));

        $this->assertAuthenticatedAs($user);
        $this->assertNotNull($user->fresh()->email_verified_at);
    }

    public function test_existing_user_who_never_agreed_sees_the_agreement_once(): void
    {
        User::factory()->termsNotAccepted()->create(['email' => 'old@example.com']);

        $this->post(route('magic-link.consume', $this->token('old@example.com')))->assertRedirect(route('agreement.show'));
    }

    public function test_magic_link_never_promotes_admin(): void
    {
        config(['auth.super_admin_emails' => ['boss@x.com']]);

        $this->post(route('magic-link.consume', $this->token('boss@x.com')));

        $this->assertSame('commenter', User::where('email', 'boss@x.com')->sole()->role);
    }

    public function test_magic_link_is_single_use(): void
    {
        $plain = $this->token();

        $this->post(route('magic-link.consume', $plain));
        auth()->logout();
        $this->flushSession();

        $this->post(route('magic-link.consume', $plain))
            ->assertRedirect(route('login'))
            ->assertSessionHasErrors('login');
        $this->assertGuest();
    }

    public function test_magic_link_expires_after_15_minutes(): void
    {
        $plain = $this->token();
        $this->travel(16)->minutes();

        $this->post(route('magic-link.consume', $plain))->assertRedirect(route('login'));

        $this->assertGuest();
        $this->assertSame(0, User::count());
    }

    public function test_magic_link_matches_existing_user_case_insensitively(): void
    {
        $user = User::factory()->create(['email' => 'foo@x.com']);

        $this->post(route('magic-link.consume', $this->token('Foo@X.com')));

        $this->assertAuthenticatedAs($user);
        $this->assertSame(1, User::count());
    }

    public function test_magic_link_honours_sanitized_redirect(): void
    {
        User::factory()->create(['email' => 'r@x.com']);

        $this->post(route('magic-link.consume', $this->token('r@x.com', ['redirect_to' => '/consultation?sa_ref=abc'])))
            ->assertRedirect('/consultation?sa_ref=abc');

        auth()->logout();
        $this->post(route('magic-link.consume', $this->token('r@x.com', ['redirect_to' => 'https://evil.test'])))
            ->assertRedirect(route('blog.index', absolute: false));
    }

    public function test_get_does_not_consume_token(): void
    {
        $plain = $this->token('peek@example.com');

        $this->get(route('magic-link.show', $plain))
            ->assertOk()
            ->assertInertia(fn ($p) => $p->component('Auth/MagicLinkConfirm')->where('email', 'peek@example.com'));

        $this->assertGuest();
        $this->assertNull(MagicLoginToken::sole()->used_at);
        $this->assertSame(0, User::count());

        $this->get(route('magic-link.show', 'bogus'))->assertRedirect(route('login'));
    }

    public function test_magic_link_rotates_password_of_unverified_existing_account(): void
    {
        $user = User::factory()->unverified()->create(['email' => 'victim@example.com', 'password' => 'attacker-chosen']);
        $oldRemember = $user->remember_token;

        $this->post(route('magic-link.consume', $this->token('victim@example.com')));

        $fresh = $user->fresh();
        $this->assertFalse(Hash::check('attacker-chosen', $fresh->password));
        $this->assertNotSame($oldRemember, $fresh->remember_token);
    }

    public function test_magic_link_claim_of_unverified_account_removes_passkeys_and_sessions(): void
    {
        config(['session.driver' => 'database']);
        $victim = User::factory()->unverified()->create(['email' => 'claim@example.com']);
        $other = User::factory()->create();
        Passkey::factory()->create(['authenticatable_id' => $victim->id]);
        foreach (['attacker-sess' => $victim->id, 'other-sess' => $other->id] as $id => $userId) {
            DB::table('sessions')->insert(['id' => $id, 'user_id' => $userId, 'payload' => '', 'last_activity' => time()]);
        }

        $this->post(route('magic-link.consume', $this->token('claim@example.com')));

        $this->assertAuthenticatedAs($victim);
        $this->assertSame(0, $victim->passkeys()->count());
        $this->assertDatabaseMissing('sessions', ['id' => 'attacker-sess']);
        $this->assertDatabaseHas('sessions', ['id' => 'other-sess']);
    }

    public function test_send_accepts_long_same_origin_redirect(): void
    {
        $this->turnstile();
        $redirect = '/consultation?ref='.str_repeat('a', 582);
        $this->assertSame(600, strlen($redirect));

        $this->send('long@example.com', ['redirect' => $redirect])->assertSessionHasNoErrors();

        $this->assertSame($redirect, MagicLoginToken::sole()->redirect_to);
    }

    public function test_send_hides_mailer_failure(): void
    {
        $this->turnstile();
        Mail::shouldReceive('to')->andThrow(new \RuntimeException('resend down'));
        Log::spy();

        $this->send('boom@example.com')
            ->assertSessionHasNoErrors()
            ->assertSessionHas('status', 'Check your inbox for a sign-in link. It expires in 15 minutes.');

        Log::shouldHaveReceived('error')->once();
    }

    public function test_auth_throttle_does_not_share_the_default_ip_bucket(): void
    {
        $this->turnstile();
        for ($i = 0; $i < 6; $i++) {
            $this->getJson(route('passkeys.login-options'))->assertOk();
        }

        $this->send()->assertSessionHasNoErrors()->assertStatus(302);
    }

    public function test_magic_link_honours_intended_url_when_no_redirect_given(): void
    {
        User::factory()->create(['email' => 'boss@x.com', 'role' => 'admin']);

        $this->withSession(['url.intended' => url('/admin/posts')])
            ->post(route('magic-link.consume', $this->token('boss@x.com')))
            ->assertRedirect(url('/admin/posts'));
    }

    public function test_signed_in_users_visiting_guest_routes_are_sent_home_by_role(): void
    {
        $this->actingAs(User::factory()->create(['role' => 'commenter']))
            ->get(route('login'))->assertRedirect(route('blog.index'));

        $this->actingAs(User::factory()->create(['role' => 'admin']))
            ->get(route('login'))->assertRedirect(route('dashboard'));
    }
}
