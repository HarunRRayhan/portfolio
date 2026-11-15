<?php

namespace Tests\Feature;

use App\Models\GithubSponsorship;
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

    public function test_cancelled_monthly_does_not_unlock(): void
    {
        $user = User::factory()->create();
        $this->sponsor($user, ['status' => GithubSponsorship::STATUS_CANCELLED]);
        $this->assertFalse(RoadmapAccess::canAccessPaid($user));
    }

    public function test_consultation_tier_without_price_unlocks(): void
    {
        $user = User::factory()->create();
        $this->sponsor($user, ['tier_slug' => 'pro', 'monthly_price_cents' => null, 'kind' => GithubSponsorship::KIND_ONE_TIME, 'started_at' => now()->subDays(50)]);
        $this->assertTrue(RoadmapAccess::canAccessPaid($user));
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
}
