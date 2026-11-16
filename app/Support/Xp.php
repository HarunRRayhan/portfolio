<?php

namespace App\Support;

use App\Models\User;
use App\Models\XpAward;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/** XP ledger: one row per (user, key), so every cap is a unique key. */
class Xp
{
    public const POINTS = ['signup' => 50, 'newsletter' => 25, 'lesson' => 10, 'topic' => 25, 'comment' => 5, 'reply' => 3];

    public const PERIODS = ['week', 'month', 'all'];

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

    public static function since(string $period): ?Carbon
    {
        return match ($period) {
            'week' => now()->utc()->startOfWeek(Carbon::MONDAY),
            'month' => now()->utc()->startOfMonth(),
            default => null,
        };
    }

    /** @return Collection<int, array{rank:int,user_id:int,name:string,avatar_url:?string,xp:int}> */
    public static function board(string $period, int $limit = 50): Collection
    {
        return self::totals($period)->limit($limit)->get()->values()->map(fn ($r, $i) => [
            'rank' => $i + 1,
            'user_id' => (int) $r->user_id,
            'name' => self::publicName((string) $r->name, (string) $r->email),
            'avatar_url' => $r->avatar_url,
            'xp' => (int) $r->xp,
        ]);
    }

    /** The user's own rank among visible users, counted even when they hide themselves. */
    public static function rankOf(User $user, string $period): ?array
    {
        $xp = (int) XpAward::where('user_id', $user->id)
            ->when(self::since($period), fn ($q, $since) => $q->where('created_at', '>=', $since))
            ->sum('points');
        if ($xp === 0) {
            return null;
        }
        $ahead = DB::query()->fromSub(self::totals($period)->where('users.id', '!=', $user->id), 't')->where('xp', '>', $xp)->count();

        return ['rank' => $ahead + 1, 'xp' => $xp];
    }

    /** Magic-link accounts are named after their email's local part; don't publish that on the board. */
    private static function publicName(string $name, string $email): string
    {
        return strcasecmp($name, Str::before($email, '@')) === 0 ? mb_substr($name, 0, 2).'•••' : $name;
    }

    private static function totals(string $period)
    {
        return XpAward::query()
            ->join('users', 'users.id', '=', 'xp_awards.user_id')
            ->when(self::since($period), fn ($q, $since) => $q->where('xp_awards.created_at', '>=', $since))
            ->where('users.leaderboard_hidden', false)
            ->whereNull('users.deletion_scheduled_at')
            ->where(fn ($q) => $q->whereNull('users.role')->orWhere('users.role', '!=', 'admin'))
            ->groupBy('users.id', 'users.name', 'users.email', 'users.avatar_url')
            ->select('users.id as user_id', 'users.name', 'users.email', 'users.avatar_url', DB::raw('sum(xp_awards.points) as xp'))
            ->orderByDesc('xp')->orderBy('users.id');
    }
}
