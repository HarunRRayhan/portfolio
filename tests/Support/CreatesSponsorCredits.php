<?php

namespace Tests\Support;

use App\Models\ConsultationCredit;
use App\Models\User;
use App\Services\Sponsorship\SponsorCreditService;
use Illuminate\Support\Str;

trait CreatesSponsorCredits
{
    /** A one-time sponsorship credit for $tierSlug owned by $user. */
    protected function sponsorCredit(User $user, string $tierSlug = 'light', array $overrides = []): ConsultationCredit
    {
        $s = app(SponsorCreditService::class)->recordSponsorship([
            'github_sponsor_id' => (string) random_int(100000, 999999),
            'github_login' => 'sponsor',
            'tier_slug' => $tierSlug,
            'kind' => 'one_time',
            'status' => 'active',
            'source' => 'webhook',
            'started_at' => now(),
            'github_sponsorship_node_id' => 'S_'.Str::random(10),
        ]);
        $s->update(['user_id' => $user->id]);
        $credit = $s->credits()->firstOrFail();
        $credit->update(['user_id' => $user->id] + $overrides);

        return $credit->fresh();
    }
}
