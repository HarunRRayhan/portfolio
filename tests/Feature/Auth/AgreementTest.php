<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AgreementTest extends TestCase
{
    use RefreshDatabase;

    public function test_screen_requires_auth(): void
    {
        $this->get(route('agreement.show'))->assertRedirect(route('login'));
    }

    public function test_screen_renders_for_user_who_has_not_agreed(): void
    {
        $this->actingAs(User::factory()->termsNotAccepted()->create())
            ->get(route('agreement.show'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Auth/Welcome')->where('hasPasskey', false));
    }

    public function test_screen_skips_ahead_once_agreed(): void
    {
        $this->actingAs(User::factory()->create())
            ->withSession(['agreement.redirect_to' => '/consultation?coupon=X'])
            ->get(route('agreement.show'))
            ->assertRedirect('/consultation?coupon=X');
    }

    public function test_accept_requires_the_checkbox(): void
    {
        $user = User::factory()->termsNotAccepted()->create();

        $this->actingAs($user)->post(route('agreement.accept'))->assertSessionHasErrors('terms');

        $this->assertNull($user->fresh()->terms_accepted_at);
    }

    public function test_accept_records_agreement_and_returns_to_stored_target(): void
    {
        $user = User::factory()->termsNotAccepted()->create();

        $this->actingAs($user)
            ->withSession(['agreement.redirect_to' => '/consultation?coupon=X'])
            ->post(route('agreement.accept'), ['terms' => true])
            ->assertRedirect('/consultation?coupon=X')
            ->assertSessionMissing('agreement.redirect_to');

        $this->assertNotNull($user->fresh()->terms_accepted_at);
    }

    public function test_account_pages_send_unagreed_users_to_the_screen_and_back(): void
    {
        $this->actingAs(User::factory()->termsNotAccepted()->create())
            ->get('/profile?tab=passkeys')
            ->assertRedirect(route('agreement.show'))
            ->assertSessionHas('agreement.redirect_to', '/profile?tab=passkeys');
    }

    public function test_account_json_endpoints_refuse_unagreed_users(): void
    {
        $this->actingAs(User::factory()->termsNotAccepted()->create())
            ->deleteJson(route('profile.destroy'))
            ->assertForbidden();
    }

    public function test_public_pages_stay_open_to_unagreed_users(): void
    {
        $this->actingAs(User::factory()->termsNotAccepted()->create())
            ->get(route('terms'))
            ->assertOk();
    }

    public function test_passkey_registration_works_before_agreeing(): void
    {
        $this->actingAs(User::factory()->termsNotAccepted()->create())
            ->getJson(route('passkeys.register-options'))
            ->assertOk();
    }
}
