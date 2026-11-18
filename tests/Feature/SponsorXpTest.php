<?php

namespace Tests\Feature;

use App\Mail\Sponsorship\RoadmapAccessGrantedMail;
use App\Models\GithubSponsorship;
use App\Models\RoadmapAccessGrant;
use App\Models\User;
use App\Models\XpAward;
use App\Support\SponsorXp;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class SponsorXpTest extends TestCase
{
    use RefreshDatabase;

    private function sponsorXp(User $user): int
    {
        return (int) XpAward::where('user_id', $user->id)->where('key', 'like', 'sponsor:%')->sum('points');
    }

    public function test_github_sponsors_get_100_xp_per_dollar_and_a_tag(): void
    {
        $user = User::factory()->create(['email_verified_at' => now()]);
        $other = User::factory()->create();
        GithubSponsorship::create([
            'github_sponsor_id' => '555', 'github_login' => 'bob', 'user_id' => $user->id,
            'kind' => GithubSponsorship::KIND_MONTHLY, 'status' => GithubSponsorship::STATUS_ACTIVE,
            'source' => GithubSponsorship::SOURCE_WEBHOOK, 'monthly_price_cents' => 500, 'started_at' => now()->subDays(40),
        ]);

        $this->artisan('sponsors:sync')->assertSuccessful();
        $this->assertSame(1000, $this->sponsorXp($user)); // two $5 charges
        $this->artisan('sponsors:sync')->assertSuccessful();
        $this->assertSame(1000, $this->sponsorXp($user)); // idempotent
        $this->assertTrue(SponsorXp::isSponsor($user));
        $this->assertFalse(SponsorXp::isSponsor($other));

        $this->get('/leaderboard')->assertInertia(fn (Assert $p) => $p
            ->where('rows.0.sponsor', true)->where('rows.0.xp', 1050)
            ->where('rows.1.sponsor', false));
        $this->get('/u/'.$user->profileHandle())->assertInertia(fn (Assert $p) => $p->where('profile.sponsor', true));
    }

    public function test_manual_grant_emails_gives_xp_and_revoke_takes_it_back(): void
    {
        Mail::fake();
        $admin = User::factory()->create(['role' => 'admin', 'email_verified_at' => now(), 'terms_accepted_at' => now()]);
        $user = User::factory()->create(['email' => 'payer@example.com', 'email_verified_at' => now()]);

        $this->actingAs($admin)->post('/admin/roadmap-access', ['email' => 'Payer@example.com', 'plan' => 'yearly'])->assertRedirect();
        $grant = RoadmapAccessGrant::sole();
        $this->assertSame(1000, $grant->amount_cents);
        $this->assertNotNull($grant->notified_at);
        Mail::assertSent(RoadmapAccessGrantedMail::class, fn ($m) => $m->hasTo('payer@example.com'));
        $this->assertSame(1000, $this->sponsorXp($user));
        $this->assertStringContainsString('1,000 XP', (new RoadmapAccessGrantedMail($grant))->render());

        // A gift on a custom date: access, no XP.
        $this->actingAs($admin)->post('/admin/roadmap-access', ['email' => 'gift@example.com', 'plan' => '', 'expires_at' => now()->addWeek()->toDateString(), 'amount' => '0'])->assertRedirect();
        $this->assertSame(0, RoadmapAccessGrant::where('email', 'gift@example.com')->value('amount_cents'));

        $this->actingAs($admin)->post("/admin/roadmap-access/{$grant->id}/revoke")->assertRedirect();
        $this->assertSame(0, $this->sponsorXp($user));
        $this->assertFalse(SponsorXp::isSponsor($user));
    }

    public function test_scheduler_emails_grants_that_were_never_emailed_and_credits_late_signups(): void
    {
        Mail::fake();
        $grant = RoadmapAccessGrant::create(['email' => 'late@example.com', 'expires_at' => now()->addYear(), 'amount_cents' => 1000]);

        $this->artisan('sponsors:sync')->assertSuccessful();
        Mail::assertSent(RoadmapAccessGrantedMail::class, 1);
        $this->assertNotNull($grant->fresh()->notified_at);
        $this->artisan('sponsors:sync');
        Mail::assertSent(RoadmapAccessGrantedMail::class, 1);

        $user = User::factory()->create(['email' => 'late@example.com', 'email_verified_at' => now()]);
        $this->artisan('sponsors:sync');
        $this->assertSame(1000, $this->sponsorXp($user));
    }
}
