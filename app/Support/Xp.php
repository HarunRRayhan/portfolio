<?php

namespace App\Support;

use App\Models\User;
use App\Models\XpAward;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/** XP ledger: one row per (user, key), so every cap is a unique key. */
class Xp
{
    public const POINTS = ['signup' => 50, 'newsletter' => 25, 'lesson' => 10, 'topic' => 25, 'comment' => 5, 'reply' => 3];

    public const PERIODS = ['day', 'week', 'month', 'year', 'all'];

    /** True when a new award was written. Never throws: XP must not break the action it rides on. */
    public static function award(User|int $user, string $key, int $points, ?int $commentId = null, ?Carbon $at = null): bool
    {
        try {
            XpAward::create([
                'user_id' => $user instanceof User ? $user->id : $user,
                'key' => $key,
                'points' => $points,
                'comment_id' => $commentId,
                'created_at' => $at ?? now(),
            ]);
        } catch (UniqueConstraintViolationException) {
            return false;
        } catch (\Throwable $e) {
            report($e);

            return false;
        }

        if ($at === null && app()->bound('request') && request()->hasSession()) {
            request()->session()->flash('xp', $points + (int) request()->session()->get('xp', 0));
        }

        return true;
    }

    public static function revokeComment(int $commentId): void
    {
        XpAward::where('comment_id', $commentId)->delete();
    }

    /** The UTC window [start, end) of a period: the current one, or the one before it. All time has none. */
    public static function window(string $period, bool $previous = false): ?array
    {
        $now = now()->utc();
        $start = match ($period) {
            'day' => $now->copy()->startOfDay(),
            'week' => $now->copy()->startOfWeek(Carbon::MONDAY),
            'month' => $now->copy()->startOfMonth(),
            'year' => $now->copy()->startOfYear(),
            default => null,
        };
        if ($start === null) {
            return null;
        }
        $unit = ['day' => 'subDay', 'week' => 'subWeek', 'month' => 'subMonth', 'year' => 'subYear'][$period];

        return $previous ? [$start->copy()->{$unit}(), $start] : [$start, $start->copy()->{str_replace('sub', 'add', $unit)}()];
    }

    /** @return Collection<int, array{rank:int,user_id:int,name:string,avatar_url:?string,profile:string,xp:int}> */
    public static function board(string $period, bool $previous = false, int $limit = 50): Collection
    {
        return self::totals($period, $previous)->limit($limit)->get()->values()->map(function ($r, $i) {
            $u = (new User)->forceFill(['name' => $r->name, 'email' => $r->email, 'avatar_url' => $r->avatar_url, 'anonymous' => $r->anonymous, 'anon_name' => $r->anon_name, 'username' => $r->username, 'profile_slug' => $r->profile_slug]);

            return [
                'rank' => $i + 1,
                'user_id' => (int) $r->user_id,
                'name' => $u->publicName(),
                'avatar_url' => $u->publicAvatar(),
                'profile' => $u->profileHandle(),
                'sponsor' => (bool) $r->sponsor,
                'xp' => (int) $r->xp,
            ];
        });
    }

    /** The user's own rank among visible users, counted even when they hide themselves. */
    public static function rankOf(User $user, string $period, bool $previous = false): ?array
    {
        $xp = (int) XpAward::where('user_id', $user->id)
            ->when(self::window($period, $previous), fn ($q, $w) => $q->where('created_at', '>=', $w[0])->where('created_at', '<', $w[1]))
            ->sum('points');
        if ($xp === 0) {
            return null;
        }
        $ahead = DB::query()->fromSub(self::totals($period, $previous)->where('users.id', '!=', $user->id), 't')->where('xp', '>', $xp)->count();

        return ['rank' => $ahead + 1, 'xp' => $xp];
    }

    private static function totals(string $period, bool $previous = false)
    {
        return XpAward::query()
            ->join('users', 'users.id', '=', 'xp_awards.user_id')
            ->when(self::window($period, $previous), fn ($q, $w) => $q->where('xp_awards.created_at', '>=', $w[0])->where('xp_awards.created_at', '<', $w[1]))
            ->where('users.leaderboard_hidden', false)
            ->whereNull('users.deletion_scheduled_at')
            ->where(fn ($q) => $q->whereNull('users.role')->orWhere('users.role', '!=', 'admin'))
            ->groupBy('users.id', 'users.name', 'users.email', 'users.avatar_url', 'users.anonymous', 'users.anon_name', 'users.profile_slug', 'users.username')
            ->selectRaw("exists (select 1 from xp_awards s where s.user_id = users.id and s.key like 'sponsor:%' and s.points > 0) as sponsor")
            ->addSelect('users.id as user_id', 'users.name', 'users.email', 'users.avatar_url', 'users.anonymous', 'users.anon_name', 'users.profile_slug', 'users.username', DB::raw('sum(xp_awards.points) as xp'))
            ->orderByDesc('xp')->orderBy('users.id');
    }
}
