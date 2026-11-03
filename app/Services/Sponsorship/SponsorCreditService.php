<?php

namespace App\Services\Sponsorship;

use App\Models\ConsultationBooking;
use App\Models\ConsultationCredit;
use App\Models\ConsultationTier;
use App\Models\GithubSponsorship;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class SponsorCreditService
{
    /** Upsert a sponsorship (by node id when given) and grant its one-time credits. */
    public function recordSponsorship(array $attrs): GithubSponsorship
    {
        $tierSlug = $attrs['tier_slug'] ?? null;
        $tier = $tierSlug ? config("sponsors.tiers.$tierSlug") : null;
        $startedAt = Carbon::parse($attrs['started_at']);

        $values = [
            'github_sponsor_id' => (string) $attrs['github_sponsor_id'],
            'github_login' => $attrs['github_login'],
            'tier_slug' => $tierSlug,
            'github_tier_node_id' => $attrs['github_tier_node_id'] ?? null,
            'kind' => $attrs['kind'] ?? $tier['kind'] ?? GithubSponsorship::KIND_ONE_TIME,
            'status' => $attrs['status'] ?? GithubSponsorship::STATUS_ACTIVE,
            'source' => $attrs['source'] ?? GithubSponsorship::SOURCE_WEBHOOK,
            'grant_email' => $attrs['grant_email'] ?? null,
            'started_at' => $startedAt,
        ];

        $nodeId = $attrs['github_sponsorship_node_id'] ?? null;
        $previousStart = $nodeId ? GithubSponsorship::where('github_sponsorship_node_id', $nodeId)->value('started_at') : null;
        $s = $nodeId
            ? GithubSponsorship::updateOrCreate(['github_sponsorship_node_id' => $nodeId], $values)
            : GithubSponsorship::create($values);

        if (! $s->user_id && ($user = $this->userForGithubId($s->github_sponsor_id))) {
            $s->update(['user_id' => $user->id]);
        }

        if ($tier && $s->status === GithubSponsorship::STATUS_ACTIVE) {
            if ($s->kind === GithubSponsorship::KIND_MONTHLY) {
                $this->ensurePeriodCredits($s);
            } else {
                $period = $startedAt->toDateString();
                // A repeat purchase moves started_at forward; on the same day it needs slots after the existing ones.
                $repeat = $previousStart && $startedAt->gt(Carbon::parse($previousStart));
                $offset = (int) $s->credits()->where('period_start', $period)->max('slot');
                if ($offset === 0 || $repeat) {
                    $expires = $attrs['expires_at'] ?? $startedAt->copy()->addDays((int) config('sponsors.one_time_days'));
                    $this->grant($s, $tier, $period, Carbon::parse($expires), $offset);
                }
            }
        }

        return $s->load('credits');
    }

    public function userForGithubId(string $id): ?User
    {
        return User::query()->where('provider_name', 'github')->where('provider_id', $id)->first()
            ?? User::query()->find(DB::table('social_identities')
                ->where('provider', 'github')->where('provider_id', $id)->value('user_id'));
    }

    public function ensurePeriodCredits(GithubSponsorship $s, ?Carbon $now = null): void
    {
        $tier = $s->tier_slug ? config("sponsors.tiers.{$s->tier_slug}") : null;
        if ($s->kind !== GithubSponsorship::KIND_MONTHLY || $s->status !== GithubSponsorship::STATUS_ACTIVE || ! $tier) {
            return;
        }

        $now ??= now();
        $start = $s->started_at->copy();
        if ($now->lt($start)) {
            return;
        }
        // Anniversaries are always counted from the original start so Jan 31 -> Feb 28 -> Mar 31.
        $n = max(0, (int) $start->diffInMonths($now, true) - 1);
        while ($start->copy()->addMonthsNoOverflow($n + 1)->lte($now)) {
            $n++;
        }
        $periodStart = $start->copy()->addMonthsNoOverflow($n);

        $this->grant($s, $tier, $periodStart->toDateString(), $start->copy()->addMonthsNoOverflow($n + 1));
    }

    public function claimFor(User $user): void
    {
        $ids = collect([$user->provider_name === 'github' ? $user->provider_id : null])
            ->merge(DB::table('social_identities')->where('user_id', $user->id)->where('provider', 'github')->pluck('provider_id'))
            ->filter()->map(fn ($id) => (string) $id)->all();

        $unowned = GithubSponsorship::query()->whereNull('user_id');
        $unowned->where(function ($q) use ($ids, $user) {
            $q->whereIn('github_sponsor_id', $ids);
            if ($user->email_verified_at && $user->email) {
                $q->orWhere(fn ($m) => $m->where('source', GithubSponsorship::SOURCE_MANUAL)
                    ->whereRaw('lower(grant_email) = ?', [strtolower($user->email)]));
            }
        })->update(['user_id' => $user->id]);

        ConsultationCredit::query()->whereNull('user_id')
            ->whereIn('github_sponsorship_id', GithubSponsorship::where('user_id', $user->id)->select('id'))
            ->update(['user_id' => $user->id]);

        GithubSponsorship::query()->where('user_id', $user->id)
            ->where('kind', GithubSponsorship::KIND_MONTHLY)->where('status', GithubSponsorship::STATUS_ACTIVE)
            ->get()->each(fn ($s) => $this->ensurePeriodCredits($s));
    }

    /** @return Collection<int, ConsultationCredit> */
    public function usableCredits(User $user, string $kind = ConsultationCredit::KIND_CALL): Collection
    {
        return ConsultationCredit::query()->usable()
            ->where('user_id', $user->id)->where('kind', $kind)
            ->orderBy('expires_at')->orderBy('id')->get();
    }

    public function releaseForBooking(ConsultationBooking $b): void
    {
        ConsultationCredit::query()->where('used_by_booking_id', $b->id)
            ->whereNull('revoked_at')->where('expires_at', '>', now())
            ->update(['used_by_booking_id' => null, 'used_at' => null]);
    }

    /** @return Collection<int, ConsultationBooking> future bookings the caller must cancel */
    public function endSponsorship(GithubSponsorship $s, string $status): Collection
    {
        DB::transaction(function () use ($s, $status) {
            $s->update(['status' => $status, 'ended_at' => now()]);
            // Used credits are revoked too, so cancelling their bookings never frees a credit back.
            $s->credits()->whereNull('revoked_at')->update(['revoked_at' => now()]);
        });

        return ConsultationBooking::query()
            ->whereIn('id', $s->credits()->whereNotNull('used_by_booking_id')->select('used_by_booking_id'))
            ->where('starts_at', '>', now())
            ->where('status', '!=', ConsultationBooking::STATUS_CANCELLED)
            ->get();
    }

    /** Insert call + scan credits for one period; the unique key makes repeats and races no-ops. */
    private function grant(GithubSponsorship $s, array $tier, string $periodStart, Carbon $expiresAt, int $offset = 0): void
    {
        $rows = [];
        $slot = $offset;
        foreach ($tier['calls'] as $tierSlug => $count) {
            $tierId = ConsultationTier::query()->where('slug', $tierSlug)->value('id');
            for ($i = 0; $i < $count; $i++) {
                $rows[] = $this->row($s, ConsultationCredit::KIND_CALL, $tierId, ++$slot, $periodStart, $expiresAt);
            }
        }
        for ($i = 1; $i <= ($tier['scans'] ?? 0); $i++) {
            $rows[] = $this->row($s, ConsultationCredit::KIND_SCAN, null, $offset + $i, $periodStart, $expiresAt);
        }

        ConsultationCredit::query()->insertOrIgnore($rows);
    }

    private function row(GithubSponsorship $s, string $kind, ?int $tierId, int $slot, string $periodStart, Carbon $expiresAt): array
    {
        return [
            'github_sponsorship_id' => $s->id,
            'user_id' => $s->user_id,
            'kind' => $kind,
            'consultation_tier_id' => $tierId,
            'period_start' => $periodStart,
            'slot' => $slot,
            'expires_at' => $expiresAt->toDateTimeString(),
            'created_at' => now()->toDateTimeString(),
            'updated_at' => now()->toDateTimeString(),
        ];
    }
}
