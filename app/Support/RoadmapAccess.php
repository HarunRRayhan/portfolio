<?php

namespace App\Support;

use App\Models\GithubSponsorship;
use App\Models\RoadmapAccessGrant;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * Who may open Intermediate and Advanced roadmap stages.
 *
 * Access follows the total a person has given, across one or many payments:
 * $5 opens a month, $10 a year, $100 for life, counted from their latest payment.
 */
final class RoadmapAccess
{
    public const MIN_CENTS = 500;

    public const YEAR_CENTS = 1000;

    public const LIFETIME_CENTS = 10000;

    public static function canAccessPaid(?User $user): bool
    {
        if (! $user) {
            return false;
        }

        $email = $user->email_verified_at && $user->email ? strtolower($user->email) : null;

        if ($email && RoadmapAccessGrant::query()->active()->whereRaw('lower(email) = ?', [$email])->exists()) {
            return true;
        }

        $until = self::accessUntil(self::sponsorships($user, $email));

        return $until === true || ($until instanceof Carbon && $until->isFuture());
    }

    /**
     * true for lifetime, the end of access otherwise, null when nothing counts.
     *
     * @param  iterable<GithubSponsorship>  $sponsorships
     */
    public static function accessUntil(iterable $sponsorships): Carbon|bool|null
    {
        $total = 0;
        $lastPaid = null;
        foreach ($sponsorships as $s) {
            // A consultation tier without a stored amount still counts as at least $5.
            $price = $s->monthly_price_cents ?? ($s->tier_slug ? self::MIN_CENTS : 0);
            if ($price <= 0) {
                continue;
            }
            $payments = 1;
            $paidAt = $s->started_at->copy();
            if ($s->kind === GithubSponsorship::KIND_MONTHLY) {
                // GitHub bills on the start day each month until the sponsorship ends.
                $end = $s->ended_at && $s->ended_at->isPast() ? $s->ended_at : now();
                // A charge on the end date itself didn't happen: GitHub ends sponsorships at the paid-through date.
                $months = (int) floor($s->started_at->diffInMonths($end));
                $payments = $s->started_at->copy()->addMonthsNoOverflow($months)->lt($end) ? $months + 1 : max(1, $months);
                $paidAt = $s->started_at->copy()->addMonthsNoOverflow($payments - 1);
            }
            $total += $price * $payments;
            $lastPaid = $lastPaid === null || $paidAt->gt($lastPaid) ? $paidAt : $lastPaid;
        }

        return match (true) {
            $total >= self::LIFETIME_CENTS => true,
            $total >= self::YEAR_CENTS => $lastPaid->copy()->addYear(),
            $total >= self::MIN_CENTS => $lastPaid->copy()->addMonth(),
            default => null,
        };
    }

    /** @return Collection<int, GithubSponsorship> */
    private static function sponsorships(User $user, ?string $email)
    {
        // Same linking as consultation credits (SponsorCreditService::claimFor), read-only.
        $githubIds = collect([$user->provider_name === 'github' ? $user->provider_id : null])
            ->merge(DB::table('social_identities')->where('user_id', $user->id)->where('provider', 'github')->pluck('provider_id'))
            ->filter()->map(fn ($id) => (string) $id)->all();

        return GithubSponsorship::query()
            ->where('status', '!=', GithubSponsorship::STATUS_REVOKED) // revoke is the refund path
            ->where(function ($q) use ($user, $githubIds, $email) {
                $q->where('user_id', $user->id)->orWhereIn('github_sponsor_id', $githubIds);
                if ($email) {
                    $q->orWhere(fn ($m) => $m->where('source', GithubSponsorship::SOURCE_MANUAL)->whereRaw('lower(grant_email) = ?', [$email]));
                }
            })
            ->get();
    }
}
