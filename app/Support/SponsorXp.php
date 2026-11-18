<?php

namespace App\Support;

use App\Models\User;
use App\Models\XpAward;

/** Sponsors earn 100 XP per dollar given (1 XP per cent), from GitHub Sponsors and manual grants alike. */
final class SponsorXp
{
    public const KEY_PREFIX = 'sponsor:';

    /** Bring the user's sponsor XP up to date. Returns the XP added (negative after a revoke). */
    public static function sync(User $user): int
    {
        $target = RoadmapAccess::sponsoredCents($user);
        $awards = XpAward::where('user_id', $user->id)->where('key', 'like', self::KEY_PREFIX.'%');
        $have = (int) (clone $awards)->sum('points');

        if ($target > $have) {
            // One row per step up, so each new payment lands in the period it was paid.
            Xp::award($user, self::KEY_PREFIX.$target, $target - $have, null, now());

            return $target - $have;
        }
        if ($target < $have) {
            $awards->delete();
            if ($target > 0) {
                Xp::award($user, self::KEY_PREFIX.$target, $target, null, now());
            }

            return $target - $have;
        }

        return 0;
    }

    public static function isSponsor(User $user): bool
    {
        return XpAward::where('user_id', $user->id)->where('key', 'like', self::KEY_PREFIX.'%')->where('points', '>', 0)->exists();
    }
}
