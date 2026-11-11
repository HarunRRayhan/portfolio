<?php

namespace Tests\Feature;

use App\Models\ConsultationBooking;
use App\Models\ConsultationCredit;
use App\Models\ConsultationTier;
use App\Models\GithubSponsorship;
use App\Models\User;
use App\Services\Sponsorship\SponsorCreditService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class SponsorCreditServiceTest extends TestCase
{
    use RefreshDatabase;

    private function svc(): SponsorCreditService
    {
        return app(SponsorCreditService::class);
    }

    private function attrs(array $over = []): array
    {
        return array_merge([
            'github_sponsor_id' => '1001',
            'github_login' => 'alice',
            'tier_slug' => 'max',
            'kind' => 'one_time',
            'status' => 'active',
            'source' => 'webhook',
            'started_at' => Carbon::parse('2026-11-03 09:00:00'),
            'github_sponsorship_node_id' => 'S_1',
        ], $over);
    }

    private function booking(Carbon $startsAt, string $status = 'confirmed'): ConsultationBooking
    {
        return ConsultationBooking::create([
            'consultation_tier_id' => ConsultationTier::query()->where('slug', 'max')->value('id'),
            'client_name' => 'C', 'client_email' => 'c@example.test',
            'starts_at' => $startsAt, 'ends_at' => $startsAt->copy()->addHour(),
            'status' => $status, 'list_price_cents' => 0, 'amount_due_cents' => 0,
            'access_token_hash' => hash('sha256', random_bytes(8)),
        ]);
    }

    public function test_one_time_grant_gives_one_credit_expiring_in_60_days(): void
    {
        $this->travelTo(Carbon::parse('2026-11-03 10:00:00'));
        $s = $this->svc()->recordSponsorship($this->attrs());

        $this->assertCount(1, $s->credits);
        $c = $s->credits->first();
        $this->assertSame('call', $c->kind);
        $this->assertSame('max', $c->tier->slug);
        $this->assertSame('2027-01-02', $c->expires_at->toDateString());
        $this->assertSame(1, $c->slot);
    }

    public function test_unmapped_tier_is_donation_with_no_credits(): void
    {
        $s = $this->svc()->recordSponsorship($this->attrs(['tier_slug' => null]));
        $this->assertSame(0, $s->credits()->count());
    }

    public function test_record_is_idempotent_by_node_id_and_honours_expires_override(): void
    {
        $this->svc()->recordSponsorship($this->attrs());
        $this->svc()->recordSponsorship($this->attrs());
        $this->assertSame(1, GithubSponsorship::count());
        $this->assertSame(1, ConsultationCredit::count());

        $s = $this->svc()->recordSponsorship($this->attrs([
            'github_sponsorship_node_id' => null, 'source' => 'manual',
            'expires_at' => Carbon::parse('2027-06-01'),
        ]));
        $this->assertSame('2027-06-01', $s->credits->first()->expires_at->toDateString());
    }

    public function test_monthly_period_credits_created_once(): void
    {
        $this->travelTo(Carbon::parse('2026-11-10 10:00:00'));
        $s = $this->svc()->recordSponsorship($this->attrs(['tier_slug' => 'monthly', 'kind' => 'monthly']));
        $this->svc()->ensurePeriodCredits($s);
        $this->svc()->ensurePeriodCredits($s);

        $this->assertSame(2, $s->credits()->where('kind', 'call')->count());
        $this->assertSame(1, $s->credits()->where('kind', 'scan')->count());
        $this->assertNull($s->credits()->where('kind', 'scan')->first()->consultation_tier_id);
        $this->assertSame('2026-12-03', $s->credits()->first()->expires_at->toDateString());
    }

    public function test_monthly_jan_31_february_period(): void
    {
        $this->travelTo(Carbon::parse('2027-02-28 10:00:00'));
        $s = $this->svc()->recordSponsorship($this->attrs([
            'tier_slug' => 'monthly', 'kind' => 'monthly', 'started_at' => Carbon::parse('2027-01-31 09:00:00'),
        ]));
        $this->svc()->ensurePeriodCredits($s);

        $this->assertSame(3, $s->credits()->count());
        $this->assertSame('2027-02-28', $s->credits()->first()->period_start->toDateString());
        $this->assertSame('2027-03-31', $s->credits()->first()->expires_at->toDateString());
    }

    public function test_cancelled_monthly_creates_no_new_period(): void
    {
        $this->travelTo(Carbon::parse('2026-11-10'));
        $s = $this->svc()->recordSponsorship($this->attrs(['tier_slug' => 'monthly', 'kind' => 'monthly']));
        $s->update(['status' => 'cancelled']);
        $this->travelTo(Carbon::parse('2027-01-10'));
        $this->svc()->ensurePeriodCredits($s->fresh());

        $this->assertSame(3, $s->credits()->count());
    }

    public function test_claim_attaches_by_github_identity_in_users_and_social_identities(): void
    {
        $s1 = $this->svc()->recordSponsorship($this->attrs());
        $s2 = $this->svc()->recordSponsorship($this->attrs([
            'github_sponsor_id' => '2002', 'github_sponsorship_node_id' => 'S_2',
        ]));
        $this->assertNull($s1->user_id);

        $u1 = User::factory()->create(['provider_name' => 'github', 'provider_id' => '1001']);
        $u2 = User::factory()->create();
        DB::table('social_identities')->insert([
            'user_id' => $u2->id, 'provider' => 'github', 'provider_id' => '2002',
            'created_at' => now(), 'updated_at' => now(),
        ]);

        $this->svc()->claimFor($u1);
        $this->svc()->claimFor($u2);

        $this->assertSame($u1->id, $s1->fresh()->user_id);
        $this->assertSame($u1->id, $s1->credits()->first()->user_id);
        $this->assertSame($u2->id, $s2->fresh()->user_id);
        $this->assertCount(1, $this->svc()->usableCredits($u2));
    }

    public function test_claim_by_email_only_for_manual_grants(): void
    {
        $web = $this->svc()->recordSponsorship($this->attrs(['grant_email' => 'Bob@Example.test']));
        $man = $this->svc()->recordSponsorship($this->attrs([
            'github_sponsor_id' => 'manual-1', 'github_sponsorship_node_id' => null,
            'source' => 'manual', 'grant_email' => 'Bob@Example.test',
        ]));
        $unverified = User::factory()->unverified()->create(['email' => 'bob@example.test']);
        $this->svc()->claimFor($unverified);
        $this->assertNull($man->fresh()->user_id);

        $unverified->forceFill(['email_verified_at' => now()])->save();
        $u = $unverified;
        $this->svc()->claimFor($u);

        $this->assertNull($web->fresh()->user_id);
        $this->assertSame($u->id, $man->fresh()->user_id);
        $this->assertSame($u->id, $man->credits()->first()->user_id);
    }

    public function test_release_skips_expired_and_revoked_credits(): void
    {
        $this->travelTo(Carbon::parse('2026-11-03 10:00:00'));
        $s = $this->svc()->recordSponsorship($this->attrs());
        $mk = fn (array $o, int $slot) => ConsultationCredit::create(array_merge([
            'github_sponsorship_id' => $s->id, 'kind' => 'call', 'period_start' => '2026-11-03',
            'slot' => $slot, 'expires_at' => now()->addDays(10),
        ], $o));
        $ok = $mk(['used_at' => now()], 5);
        $revoked = $mk(['used_at' => now(), 'revoked_at' => now()], 6);
        $expired = $mk(['used_at' => now(), 'expires_at' => now()->subDay()], 7);
        $b = $this->booking(now()->addDays(3));
        foreach ([$ok, $revoked, $expired] as $c) {
            $c->update(['used_by_booking_id' => $b->id]);
        }

        $this->svc()->releaseForBooking($b);

        $this->assertNull($ok->fresh()->used_by_booking_id);
        $this->assertNull($ok->fresh()->used_at);
        $this->assertSame($b->id, $revoked->fresh()->used_by_booking_id);
        $this->assertSame($b->id, $expired->fresh()->used_by_booking_id);
    }

    public function test_end_revokes_all_credits_and_returns_future_bookings(): void
    {
        $this->travelTo(Carbon::parse('2026-11-10 10:00:00'));
        $s = $this->svc()->recordSponsorship($this->attrs(['tier_slug' => 'monthly', 'kind' => 'monthly']));
        $credits = $s->credits()->get();
        $future = $this->booking(now()->addDays(2));
        $past = $this->booking(now()->subDays(2));
        $cancelled = $this->booking(now()->addDays(3), 'cancelled');
        foreach ([$future, $past, $cancelled] as $i => $b) {
            $credits[$i]->update(['used_by_booking_id' => $b->id, 'used_at' => now()]);
        }

        $out = $this->svc()->endSponsorship($s, 'cancelled');

        $this->assertSame([$future->id], $out->pluck('id')->all());
        $this->assertSame('cancelled', $s->fresh()->status);
        $this->assertNotNull($s->fresh()->ended_at);
        $this->assertSame(0, $s->credits()->whereNull('revoked_at')->count());

        $this->svc()->releaseForBooking($future);
        $this->assertNotNull($credits[0]->fresh()->used_by_booking_id);
    }

    public function test_end_rolls_back_status_when_revoke_fails(): void
    {
        $s = $this->svc()->recordSponsorship($this->attrs());
        DB::listen(function ($q) {
            if (str_starts_with(strtolower($q->sql), 'update "consultation_credits"')) {
                throw new \RuntimeException('revoke failed');
            }
        });

        try {
            $this->svc()->endSponsorship($s, 'cancelled');
            $this->fail('expected the revoke to throw');
        } catch (\RuntimeException $e) {
            $this->assertSame('revoke failed', $e->getMessage());
        }

        $this->assertSame('active', GithubSponsorship::findOrFail($s->id)->status);
    }
}
