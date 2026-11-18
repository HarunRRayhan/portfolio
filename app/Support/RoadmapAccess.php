<?php

namespace App\Support;

use App\Models\GithubSponsorship;
use App\Models\GithubWebhookEvent;
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
        [$total, $lastPaid] = self::paid($sponsorships);

        return match (true) {
            $total >= self::LIFETIME_CENTS => true,
            $total >= self::YEAR_CENTS => $lastPaid->copy()->addYear(),
            $total >= self::MIN_CENTS => $lastPaid->copy()->addMonth(),
            default => null,
        };
    }

    /** Everything this person has given: GitHub Sponsors charges plus non-revoked manual grants. */
    public static function sponsoredCents(User $user): int
    {
        $email = $user->email_verified_at && $user->email ? strtolower($user->email) : null;
        $grants = $email ? (int) RoadmapAccessGrant::query()->whereNull('revoked_at')->whereRaw('lower(email) = ?', [$email])->sum('amount_cents') : 0;

        return self::paid(self::sponsorships($user, $email))[0] + $grants;
    }

    /**
     * @param  iterable<GithubSponsorship>  $sponsorships
     * @return array{0: int, 1: ?Carbon} total cents, last charge
     */
    private static function paid(iterable $sponsorships): array
    {
        $total = 0;
        $lastPaid = null;
        foreach ($sponsorships as $s) {
            // A consultation tier without a stored amount still counts as at least $5.
            $price = $s->monthly_price_cents ?? ($s->tier_slug ? self::MIN_CENTS : 0);
            if ($price <= 0) {
                continue;
            }
            $paidAt = $s->started_at->copy();
            $paid = $price;
            if ($s->kind === GithubSponsorship::KIND_MONTHLY) {
                // GitHub bills on the start day each month until the sponsorship ends; the end date itself is not a charge.
                $end = $s->ended_at && $s->ended_at->isPast() ? $s->ended_at : now();
                $prices = self::priceHistory($s, $price);
                $paid = 0;
                for ($k = 0, $charge = $s->started_at->copy(); $k === 0 || $charge->lt($end); $charge = $s->started_at->copy()->addMonthsNoOverflow(++$k)) {
                    $paidAt = $charge;
                    $paid += self::priceOn($prices, $charge, $price);
                }
            }
            $total += $paid;
            $lastPaid = $lastPaid === null || $paidAt->gt($lastPaid) ? $paidAt : $lastPaid;
        }

        return [$total, $lastPaid];
    }

    /**
     * Tier price over time from the stored webhooks, so an upgrade never re-prices months already paid.
     *
     * @return list<array{0: Carbon, 1: int}> [effective from, cents], oldest first
     */
    private static function priceHistory(GithubSponsorship $s, int $current): array
    {
        if (! $s->github_sponsorship_node_id) {
            return [];
        }
        // payload is a json column: cast it so Postgres can LIKE.
        $events = GithubWebhookEvent::query()->where('event', 'sponsorship')->where('action', 'tier_changed')
            ->whereRaw('CAST(payload AS TEXT) LIKE ?', ['%'.$s->github_sponsorship_node_id.'%'])->orderBy('created_at')->orderBy('id')->get();
        $history = [];
        foreach ($events as $e) {
            $body = (array) $e->payload;
            if (($body['sponsorship']['node_id'] ?? null) !== $s->github_sponsorship_node_id) {
                continue;
            }
            if ($history === [] && isset($body['changes']['tier']['from']['monthly_price_in_cents'])) {
                $history[] = [$s->started_at->copy(), (int) $body['changes']['tier']['from']['monthly_price_in_cents']];
            }
            $history[] = [Carbon::parse($e->created_at), (int) ($body['sponsorship']['tier']['monthly_price_in_cents'] ?? $current)];
        }

        return $history;
    }

    /** @param  list<array{0: Carbon, 1: int}>  $history */
    private static function priceOn(array $history, Carbon $at, int $current): int
    {
        $price = null;
        foreach ($history as [$from, $cents]) {
            if ($from->lte($at)) {
                $price = $cents;
            }
        }

        return $price ?? ($history[0][1] ?? $current);
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
