<?php

namespace Tests\Feature\Auth;

use App\Mail\MagicLoginLinkMail;
use App\Models\MagicLoginToken;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
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

        $this->post(route('magic-link.consume', $plain))->assertRedirect(route('passkeys.prompt'));

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
            ->assertSessionHas('status');
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
}
