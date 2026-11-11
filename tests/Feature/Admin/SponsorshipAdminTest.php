<?php

namespace Tests\Feature\Admin;

use App\Models\ConsultationBooking;
use App\Models\ConsultationTier;
use App\Models\GithubSponsorship;
use App\Models\User;
use App\Services\Consultation\GoogleCalendarService;
use App\Services\Sponsorship\SponsorCreditService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class SponsorshipAdminTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        return User::factory()->create(['role' => 'admin', 'terms_accepted_at' => now()]);
    }

    private function donation(): GithubSponsorship
    {
        return app(SponsorCreditService::class)->recordSponsorship([
            'github_sponsor_id' => '555', 'github_login' => 'donor', 'tier_slug' => null,
            'kind' => 'one_time', 'status' => 'active', 'source' => 'webhook',
            'started_at' => now(), 'github_sponsorship_node_id' => 'S_donor',
        ]);
    }

    public function test_admin_lists_donation_sponsorship(): void
    {
        $this->donation();

        $this->actingAs($this->admin())->get('/admin/sponsorships')->assertOk()->assertInertia(fn (Assert $p) => $p
            ->component('Admin/Sponsorships/Index')
            ->where('sponsorships.data.0.github_login', 'donor')
            ->where('sponsorships.data.0.tier_slug', null)
            ->where('sponsorships.data.0.credits', []));
    }

    public function test_grant_by_login_resolves_github_id(): void
    {
        Http::fake(['api.github.com/users/octo' => Http::response(['id' => 583231, 'login' => 'octo'])]);

        $this->actingAs($this->admin())->post('/admin/sponsorships', ['identifier' => 'octo', 'tier_slug' => 'max'])
            ->assertRedirect()->assertSessionHasNoErrors();

        $s = GithubSponsorship::firstOrFail();
        $this->assertSame('583231', $s->github_sponsor_id);
        $this->assertSame('manual', $s->source);
        $this->assertNull($s->grant_email);
        $this->assertCount(1, $s->credits);
    }

    public function test_unknown_login_is_a_validation_error(): void
    {
        Http::fake(['api.github.com/*' => Http::response([], 404)]);

        $this->actingAs($this->admin())->post('/admin/sponsorships', ['identifier' => 'nobody', 'tier_slug' => 'max'])
            ->assertSessionHasErrors('identifier');
        $this->assertDatabaseCount('github_sponsorships', 0);
    }

    public function test_grant_by_email_attaches_on_claim(): void
    {
        $this->actingAs($this->admin())->post('/admin/sponsorships', [
            'identifier' => 'Jane@Example.com', 'tier_slug' => 'light', 'expires_at' => now()->addDays(10)->toDateString(),
        ])->assertRedirect()->assertSessionHasNoErrors();

        $s = GithubSponsorship::firstOrFail();
        $this->assertSame('manual:jane@example.com', $s->github_sponsor_id);
        $this->assertSame('Jane@Example.com', $s->grant_email);
        $this->assertSame(now()->addDays(10)->toDateString(), $s->credits->first()->expires_at->toDateString());

        $user = User::factory()->create(['email' => 'jane@example.com', 'email_verified_at' => now()]);
        app(SponsorCreditService::class)->claimFor($user);
        $this->assertSame($user->id, $s->fresh()->user_id);
        $this->assertSame($user->id, $s->credits()->first()->user_id);
    }

    public function test_grant_credits_upgrades_donation_in_place(): void
    {
        $d = $this->donation();

        $this->actingAs($this->admin())->post('/admin/sponsorships', [
            'identifier' => 'donor', 'tier_slug' => 'max', 'sponsorship_id' => $d->id,
        ])->assertRedirect()->assertSessionHasNoErrors();

        $this->assertDatabaseCount('github_sponsorships', 1);
        $d->refresh();
        $this->assertSame('max', $d->tier_slug);
        $this->assertSame('webhook', $d->source);
        $this->assertCount(1, $d->credits);
    }

    public function test_revoke_cancels_future_bookings(): void
    {
        $google = $this->createMock(GoogleCalendarService::class);
        $google->method('isConnected')->willReturn(false);
        $google->method('deleteEvent')->willReturn(true);
        $this->app->instance(GoogleCalendarService::class, $google);

        $s = app(SponsorCreditService::class)->recordSponsorship([
            'github_sponsor_id' => '1', 'github_login' => 'a', 'tier_slug' => 'max',
            'started_at' => now(), 'github_sponsorship_node_id' => 'S_1',
        ]);
        $b = ConsultationBooking::create([
            'consultation_tier_id' => ConsultationTier::where('slug', 'max')->value('id'),
            'client_name' => 'C', 'client_email' => 'c@example.test',
            'starts_at' => now()->addDays(3), 'ends_at' => now()->addDays(3)->addHour(),
            'status' => 'confirmed', 'list_price_cents' => 0, 'amount_due_cents' => 0,
            'access_token_hash' => hash('sha256', 'x'),
        ]);
        $s->credits()->first()->update(['used_by_booking_id' => $b->id, 'used_at' => now()]);

        $this->actingAs($this->admin())->post("/admin/sponsorships/{$s->id}/revoke")
            ->assertRedirect()->assertSessionHas('flash.message');

        $this->assertSame('revoked', $s->fresh()->status);
        $this->assertSame('cancelled', $b->fresh()->status);
    }

    public function test_non_admin_forbidden(): void
    {
        $user = User::factory()->create(['terms_accepted_at' => now()]);
        $s = $this->donation();

        $this->get('/admin/sponsorships')->assertRedirect('/login');
        $this->actingAs($user)->get('/admin/sponsorships')->assertForbidden();
        $commenter = User::factory()->create(['role' => 'commenter', 'terms_accepted_at' => now()]);
        $this->actingAs($commenter)->get('/admin/sponsorships')->assertForbidden();
        $this->actingAs($commenter)->post("/admin/sponsorships/{$s->id}/revoke")->assertForbidden();
        $this->actingAs($user)->post('/admin/sponsorships', ['identifier' => 'a@b.co', 'tier_slug' => 'max'])->assertForbidden();
        $this->actingAs($user)->post("/admin/sponsorships/{$s->id}/revoke")->assertForbidden();
    }

    public function test_cannot_upgrade_cancelled_or_revoked_donation(): void
    {
        foreach (['cancelled', 'revoked'] as $status) {
            $d = $this->donation();
            $d->update(['status' => $status, 'github_sponsorship_node_id' => "S_$status"]);

            $this->actingAs($this->admin())->post('/admin/sponsorships', [
                'identifier' => 'donor', 'tier_slug' => 'max', 'sponsorship_id' => $d->id,
            ])->assertNotFound();

            $d->refresh();
            $this->assertSame($status, $d->status);
            $this->assertNull($d->tier_slug);
            $this->assertCount(0, $d->credits);
        }
    }

    public function test_revoke_is_a_no_op_when_not_active(): void
    {
        $d = $this->donation();
        $d->update(['status' => 'cancelled']);

        $this->actingAs($this->admin())->post("/admin/sponsorships/{$d->id}/revoke")->assertRedirect();

        $this->assertSame('cancelled', $d->fresh()->status);
        $this->assertNull($d->fresh()->ended_at);
    }
}
