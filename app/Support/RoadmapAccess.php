<?php

namespace App\Support;

use App\Models\GithubSponsorship;
use App\Models\RoadmapAccessGrant;
use App\Models\User;
use Illuminate\Support\Facades\DB;

/** Who may open Intermediate and Advanced roadmap stages. */
final class RoadmapAccess
{
    public const MIN_CENTS = 500;

    public const ONE_TIME_DAYS = 30;

    public static function canAccessPaid(?User $user): bool
    {
        if (! $user) {
            return false;
        }

        $email = $user->email_verified_at && $user->email ? strtolower($user->email) : null;

        if ($email && RoadmapAccessGrant::query()->active()->whereRaw('lower(email) = ?', [$email])->exists()) {
            return true;
        }

        // Same linking as consultation credits (SponsorCreditService::claimFor), read-only.
        $githubIds = collect([$user->provider_name === 'github' ? $user->provider_id : null])
            ->merge(DB::table('social_identities')->where('user_id', $user->id)->where('provider', 'github')->pluck('provider_id'))
            ->filter()->map(fn ($id) => (string) $id)->all();

        return GithubSponsorship::query()
            ->where('status', GithubSponsorship::STATUS_ACTIVE)
            ->where(function ($q) use ($user, $githubIds, $email) {
                $q->where('user_id', $user->id)->orWhereIn('github_sponsor_id', $githubIds);
                if ($email) {
                    $q->orWhere(fn ($m) => $m->where('source', GithubSponsorship::SOURCE_MANUAL)->whereRaw('lower(grant_email) = ?', [$email]));
                }
            })
            // $5+ (any consultation tier counts): monthly while active, one-time for 30 days.
            ->where(fn ($q) => $q->whereNotNull('tier_slug')->orWhere('monthly_price_cents', '>=', self::MIN_CENTS))
            ->where(fn ($k) => $k->where('kind', GithubSponsorship::KIND_MONTHLY)
                ->orWhere('started_at', '>=', now()->subDays(self::ONE_TIME_DAYS)))
            ->exists();
    }
}
