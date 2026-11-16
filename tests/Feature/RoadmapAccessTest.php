<?php

namespace Tests\Feature;

use App\Models\GithubSponsorship;
use App\Models\GithubWebhookEvent;
use App\Models\RoadmapAccessGrant;
use App\Models\User;
use App\Support\RoadmapAccess;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RoadmapAccessTest extends TestCase
{
    use RefreshDatabase;

    private function sponsor(User $user, array $over = []): GithubSponsorship
    {
        return GithubSponsorship::create(array_merge([
            'github_sponsor_id' => '555',
            'github_login' => 'bob',
            'user_id' => $user->id,
            'kind' => GithubSponsorship::KIND_MONTHLY,
            'status' => GithubSponsorship::STATUS_ACTIVE,
            'source' => GithubSponsorship::SOURCE_WEBHOOK,
            'monthly_price_cents' => 500,
            'started_at' => now()->subDays(3),
        ], $over));
    }

    public function test_guest_has_no_paid_access(): void
    {
        $this->assertFalse(RoadmapAccess::canAccessPaid(null));
    }

    public function test_monthly_five_dollars_or_more_unlocks(): void
    {
        $user = User::factory()->create();
        $this->sponsor($user, ['monthly_price_cents' => 500]);
        $this->assertTrue(RoadmapAccess::canAccessPaid($user));
    }

    public function test_monthly_under_five_dollars_does_not_unlock(): void
    {
        $user = User::factory()->create();
        $this->sponsor($user, ['monthly_price_cents' => 400]);
        $this->assertFalse(RoadmapAccess::canAccessPaid($user));
    }

    public function test_one_time_unlocks_for_thirty_days(): void
    {
        $fresh = User::factory()->create();
        $this->sponsor($fresh, ['kind' => GithubSponsorship::KIND_ONE_TIME, 'started_at' => now()->subDays(29)]);
        $this->assertTrue(RoadmapAccess::canAccessPaid($fresh));

        $old = User::factory()->create();
        $this->sponsor($old, ['kind' => GithubSponsorship::KIND_ONE_TIME, 'started_at' => now()->subDays(31)]);
        $this->assertFalse(RoadmapAccess::canAccessPaid($old));
    }

    public function test_cancelled_monthly_keeps_access_until_a_month_after_the_last_charge(): void
    {
        $recent = User::factory()->create();
        $this->sponsor($recent, ['status' => GithubSponsorship::STATUS_CANCELLED, 'started_at' => now()->subDays(3), 'ended_at' => now()->subDay()]);
        $this->assertTrue(RoadmapAccess::canAccessPaid($recent));

        $old = User::factory()->create();
        $this->sponsor($old, ['status' => GithubSponsorship::STATUS_CANCELLED, 'started_at' => now()->subDays(70), 'ended_at' => now()->subDays(40)]);
        $this->assertFalse(RoadmapAccess::canAccessPaid($old));
    }

    public function test_total_given_sets_the_access_length(): void
    {
        $oneTime = ['kind' => GithubSponsorship::KIND_ONE_TIME];

        // $5 + $5 = $10: a year from the latest payment.
        $twice = User::factory()->create();
        $this->sponsor($twice, $oneTime + ['started_at' => now()->subDays(300)]);
        $this->sponsor($twice, $oneTime + ['started_at' => now()->subDays(200), 'github_sponsorship_node_id' => 'b']);
        $this->assertTrue(RoadmapAccess::canAccessPaid($twice));

        $lapsed = User::factory()->create();
        $this->sponsor($lapsed, $oneTime + ['monthly_price_cents' => 1000, 'started_at' => now()->subDays(400)]);
        $this->assertFalse(RoadmapAccess::canAccessPaid($lapsed));

        $lifetime = User::factory()->create();
        $this->sponsor($lifetime, $oneTime + ['monthly_price_cents' => 10000, 'started_at' => now()->subYears(5)]);
        $this->assertTrue(RoadmapAccess::canAccessPaid($lifetime));

        // Monthly $5 for two charges, then cancelled: $10 counts as a year.
        $monthly = User::factory()->create();
        $this->sponsor($monthly, ['status' => GithubSponsorship::STATUS_CANCELLED, 'started_at' => now()->subDays(100), 'ended_at' => now()->subDays(100)->addMonths(2)]);
        $this->assertTrue(RoadmapAccess::canAccessPaid($monthly));

        $refunded = User::factory()->create();
        $this->sponsor($refunded, $oneTime + ['monthly_price_cents' => 10000, 'status' => GithubSponsorship::STATUS_REVOKED]);
        $this->assertFalse(RoadmapAccess::canAccessPaid($refunded));
    }

    public function test_consultation_tier_without_price_unlocks(): void
    {
        $user = User::factory()->create();
        $this->sponsor($user, ['tier_slug' => 'pro', 'monthly_price_cents' => null, 'kind' => GithubSponsorship::KIND_ONE_TIME, 'started_at' => now()->subDays(10)]);
        $this->assertTrue(RoadmapAccess::canAccessPaid($user));
    }

    public function test_one_time_consultation_tier_expires_after_thirty_days(): void
    {
        $user = User::factory()->create();
        $this->sponsor($user, ['tier_slug' => 'pro', 'monthly_price_cents' => null, 'kind' => GithubSponsorship::KIND_ONE_TIME, 'started_at' => now()->subDays(31)]);
        $this->assertFalse(RoadmapAccess::canAccessPaid($user));
    }

    public function test_sponsorship_linked_by_github_id_unlocks(): void
    {
        $user = User::factory()->create(['provider_name' => 'github', 'provider_id' => '777']);
        $this->sponsor(User::factory()->create(), ['user_id' => null, 'github_sponsor_id' => '777']);
        $this->assertTrue(RoadmapAccess::canAccessPaid($user));
    }

    public function test_manual_sponsorship_linked_by_grant_email_unlocks(): void
    {
        $user = User::factory()->create(['email' => 'google@example.com']);
        $this->sponsor($user, ['user_id' => null, 'source' => GithubSponsorship::SOURCE_MANUAL, 'grant_email' => 'Google@Example.com']);
        $this->assertTrue(RoadmapAccess::canAccessPaid($user));
    }

    public function test_manual_grants_respect_expiry_and_revoke(): void
    {
        $user = User::factory()->create(['email' => 'foo@x.com']);
        $grant = RoadmapAccessGrant::create(['email' => 'Foo@X.com', 'expires_at' => now()->addDay()]);
        $this->assertTrue(RoadmapAccess::canAccessPaid($user));

        $grant->update(['revoked_at' => now()]);
        $this->assertFalse(RoadmapAccess::canAccessPaid($user->fresh()));

        $grant->update(['revoked_at' => null, 'expires_at' => now()->subMinute()]);
        $this->assertFalse(RoadmapAccess::canAccessPaid($user->fresh()));
    }

    public function test_unverified_email_does_not_match_grants(): void
    {
        $user = User::factory()->unverified()->create(['email' => 'foo@x.com']);
        RoadmapAccessGrant::create(['email' => 'foo@x.com', 'expires_at' => now()->addDay()]);
        $this->assertFalse(RoadmapAccess::canAccessPaid($user));
    }

    public function test_backfill_reads_amount_from_latest_stored_webhook(): void
    {
        $user = User::factory()->create();
        $s = $this->sponsor($user, ['monthly_price_cents' => null, 'github_sponsorship_node_id' => 'S_1']);
        $other = $this->sponsor($user, ['monthly_price_cents' => 300, 'github_sponsorship_node_id' => 'S_2']);
        foreach ([['created', 'S_1', 300], ['tier_changed', 'S_1', 700], ['created', 'S_2', 900]] as $i => [$action, $node, $cents]) {
            GithubWebhookEvent::create(['delivery_id' => "d$i", 'event' => 'sponsorship', 'action' => $action,
                'payload' => ['sponsorship' => ['node_id' => $node, 'tier' => ['monthly_price_in_cents' => $cents]]]]);
        }
        $this->assertFalse(RoadmapAccess::canAccessPaid($user->fresh()));

        (require database_path('migrations/2026_11_16_100000_backfill_github_sponsorship_monthly_price.php'))->up();

        $this->assertSame(700, $s->fresh()->monthly_price_cents);
        $this->assertSame(300, $other->fresh()->monthly_price_cents); // already set: untouched
        $this->assertTrue(RoadmapAccess::canAccessPaid($user->fresh()));
    }
}
