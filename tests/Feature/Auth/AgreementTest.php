<?php

namespace Tests\Feature\Auth;

use App\Models\Subscriber;
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

    public function test_agreeing_without_the_newsletter_box_subscribes_nothing_and_skips_the_popup(): void
    {
        $user = User::factory()->create(['terms_accepted_at' => null]);

        $this->actingAs($user)->post(route('agreement.accept'), ['terms' => true])->assertRedirect();

        $this->assertSame(0, Subscriber::count());
        $this->actingAs($user)->get('/roadmaps')->assertInertia(fn ($p) => $p->where('newsletter.offerAfterSignup', false));
    }

    public function test_ticking_the_newsletter_box_subscribes_the_verified_email(): void
    {
        $user = User::factory()->create(['terms_accepted_at' => null, 'email' => 'tick@example.com']);

        $this->actingAs($user)->post(route('agreement.accept'), ['terms' => true, 'newsletter' => true])->assertRedirect();

        $this->assertTrue(Subscriber::isSubscribed('tick@example.com'));
    }

    public function test_an_unverified_account_is_not_subscribed_from_the_box(): void
    {
        $user = User::factory()->unverified()->create(['terms_accepted_at' => null]);

        $this->actingAs($user)->post(route('agreement.accept'), ['terms' => true, 'newsletter' => true]);

        $this->assertSame(0, Subscriber::count());
    }

    public function test_no_offer_when_the_account_email_is_already_subscribed(): void
    {
        $user = User::factory()->create(['terms_accepted_at' => null, 'email' => 'a@b.com']);
        Subscriber::create(['email' => 'a@b.com', 'status' => 'subscribed', 'source' => 'footer']);

        $this->actingAs($user)->post(route('agreement.accept'), ['terms' => true]);

        $this->actingAs($user)->get('/roadmaps')->assertInertia(fn ($p) => $p
            ->where('newsletter.offerAfterSignup', false)
            ->where('newsletter.accountSubscribed', true));
    }

    public function test_account_subscribe_adds_the_verified_email(): void
    {
        $user = User::factory()->create(['email' => 'New@Example.com']);

        $this->actingAs($user)->post(route('newsletter.account'))->assertRedirect();

        $subscriber = Subscriber::whereRaw('lower(email) = ?', ['new@example.com'])->first();
        $this->assertSame('subscribed', $subscriber->status);
        $this->actingAs($user)->get('/roadmaps')->assertInertia(fn ($p) => $p->where('newsletter.accountSubscribed', true));
    }

    public function test_account_subscribe_needs_a_verified_signed_in_user(): void
    {
        $this->post(route('newsletter.account'))->assertRedirect('/login');

        $this->actingAs(User::factory()->unverified()->create())->post(route('newsletter.account'));
        $this->assertSame(0, Subscriber::where('status', 'subscribed')->count());
    }

    public function test_guests_are_not_marked_subscribed(): void
    {
        $this->get('/roadmaps')->assertInertia(fn ($p) => $p
            ->where('newsletter.accountSubscribed', false)
            ->where('newsletter.offerAfterSignup', false));
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
