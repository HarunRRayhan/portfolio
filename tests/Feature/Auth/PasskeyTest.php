<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\LaravelPasskeys\Actions\StorePasskeyAction;
use Spatie\LaravelPasskeys\Models\Passkey;
use Tests\TestCase;
use Webauthn\PublicKeyCredentialSource;

class PasskeyTest extends TestCase
{
    use RefreshDatabase;

    public function test_prompt_requires_auth(): void
    {
        $this->get(route('passkeys.prompt'))->assertRedirect(route('login'));
    }

    public function test_prompt_renders_for_signed_in_user(): void
    {
        $this->actingAs(User::factory()->create())
            ->withSession(['passkey_prompt.redirect_to' => '/consultation?coupon=X'])
            ->get(route('passkeys.prompt'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Auth/PasskeyPrompt')->where('next', '/consultation?coupon=X'));
    }

    public function test_skip_returns_to_stored_redirect(): void
    {
        $this->actingAs(User::factory()->create())
            ->withSession(['passkey_prompt.redirect_to' => '/consultation?coupon=X'])
            ->post(route('passkeys.skip'))
            ->assertRedirect('/consultation?coupon=X')
            ->assertSessionMissing('passkey_prompt.redirect_to');
    }

    public function test_register_options_returns_challenge_for_rp_host(): void
    {
        $response = $this->actingAs(User::factory()->create())
            ->getJson(route('passkeys.register-options'))
            ->assertOk();

        $this->assertSame(parse_url(config('app.url'), PHP_URL_HOST), $response->json('rp.id'));
        $this->assertSame('harun.dev', $response->json('rp.name'));
        $this->assertNotEmpty($response->json('challenge'));
        $response->assertSessionHas('passkey-registration-options');
    }

    public function test_register_options_require_auth(): void
    {
        $this->getJson(route('passkeys.register-options'))->assertUnauthorized();
    }

    public function test_store_rejects_garbage_passkey(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user)->getJson(route('passkeys.register-options'));

        $this->post(route('passkeys.store'), ['name' => 'Laptop', 'passkey' => '{"id":"x"}'])
            ->assertSessionHasErrors('passkey');

        $this->assertSame(0, $user->passkeys()->count());
    }

    public function test_register_options_exclude_existing_credentials(): void
    {
        $user = User::factory()->create();
        Passkey::factory()->create(['authenticatable_id' => $user->id]);

        $response = $this->actingAs($user)->getJson(route('passkeys.register-options'))->assertOk();

        $this->assertCount(1, $response->json('excludeCredentials'));
        $this->assertSame('public-key', $response->json('excludeCredentials.0.type'));
    }

    public function test_cannot_register_existing_credential_id(): void
    {
        // Skip attestation (covered by the package); return the factory's credential so the ids collide.
        config(['passkeys.actions.store_passkey' => get_class(new class extends StorePasskeyAction
        {
            protected function determinePublicKeyCredentialSource(string $passkeyJson, string $passkeyOptionsJson, string $hostName): PublicKeyCredentialSource
            {
                return Passkey::factory()->make()->data;
            }
        })]);

        $victim = Passkey::factory()->create();
        $attacker = User::factory()->create();

        $this->actingAs($attacker)->getJson(route('passkeys.register-options'));
        $this->post(route('passkeys.store'), ['name' => 'Copy', 'passkey' => '{"id":"x"}'])
            ->assertSessionHasErrors(['passkey' => 'This passkey is already registered.']);

        $this->assertSame(0, $attacker->passkeys()->count());
        $this->assertSame(1, Passkey::count());
        $this->assertModelExists($victim);
    }

    public function test_user_cannot_delete_another_users_passkey(): void
    {
        $passkey = Passkey::factory()->create();

        $this->actingAs(User::factory()->create())
            ->delete(route('passkeys.destroy', $passkey))
            ->assertNotFound();

        $this->assertModelExists($passkey);
    }

    public function test_user_can_delete_own_passkey(): void
    {
        $user = User::factory()->create();
        $passkey = Passkey::factory()->create(['authenticatable_id' => $user->id]);

        $this->actingAs($user)
            ->delete(route('passkeys.destroy', $passkey))
            ->assertRedirect();

        $this->assertModelMissing($passkey);
    }

    public function test_profile_lists_passkeys(): void
    {
        $user = User::factory()->create();
        Passkey::factory()->create(['authenticatable_id' => $user->id, 'name' => 'MacBook']);
        // The package factory reuses one credential id; give the second row its own (credential_id is unique).
        $other = Passkey::factory()->make();
        // setRawAttributes drops the cached `data` cast, which would otherwise rewrite credential_id on save.
        $other->setRawAttributes(['credential_id' => 'someone-elses-credential'] + $other->getAttributes());
        $other->save();

        $this->actingAs($user)->get(route('profile.edit'))
            ->assertInertia(fn ($page) => $page->has('passkeys', 1)
                ->where('passkeys.0.name', 'MacBook')
                ->missing('passkeys.0.data'));
    }

    public function test_login_options_available_to_guests(): void
    {
        $response = $this->getJson(route('passkeys.login-options'))->assertOk();

        $this->assertSame(parse_url(config('app.url'), PHP_URL_HOST), $response->json('rpId'));
        $this->assertNotEmpty($response->json('challenge'));
        $response->assertSessionHas('passkey-authentication-options');
    }

    public function test_passkey_login_rejects_garbage_answer(): void
    {
        $this->post(route('passkeys.login'), ['answer' => 'not json'])
            ->assertSessionHasErrors('answer');
        $this->assertGuest();

        $this->getJson(route('passkeys.login-options'));
        $this->post(route('passkeys.login'), ['answer' => '{"id":"x","type":"public-key"}'])
            ->assertSessionHasErrors('answer');
        $this->assertGuest();
    }

    public function test_passkey_login_without_options_is_rejected(): void
    {
        Passkey::factory()->create();

        $this->post(route('passkeys.login'), ['answer' => '{"id":"x"}'])
            ->assertSessionHasErrors('answer');
        $this->assertGuest();
    }

    public function test_passkey_registration_requires_verified_email(): void
    {
        $this->actingAs(User::factory()->unverified()->create());

        $this->getJson(route('passkeys.register-options'))->assertForbidden();
        $this->postJson(route('passkeys.store'), ['name' => 'X', 'passkey' => '{}'])->assertForbidden();
    }
}
