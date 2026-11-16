<?php

namespace App\Observers;

use App\Models\BlogCommentThread;
use App\Models\RoadmapCommentThread;
use App\Models\Subscriber;
use App\Models\User;
use App\Support\Xp;
use RyanChandler\Comments\Models\Comment;

/** Awards XP when accounts, subscriptions and comments are created. Lessons are awarded in RoadmapController. */
class XpObserver
{
    public static function register(): void
    {
        User::created(function (User $user) {
            Xp::award($user, 'signup', Xp::POINTS['signup']);
            if ($user->email_verified_at && Subscriber::isSubscribed($user->email)) {
                Xp::award($user, 'newsletter', Xp::POINTS['newsletter']);
            }
        });

        Subscriber::saved(function (Subscriber $s) {
            if ($s->status !== 'subscribed' || ! $s->wasChanged('status') && ! $s->wasRecentlyCreated) {
                return;
            }
            $user = User::whereRaw('lower(email) = ?', [strtolower(trim($s->email))])->whereNotNull('email_verified_at')->first();
            if ($user) {
                Xp::award($user, 'newsletter', Xp::POINTS['newsletter']);
            }
        });

        Comment::created(function (Comment $c) {
            $page = self::page($c);
            if ($c->user_id && $page) {
                $type = $c->parent_id ? 'reply' : 'comment';
                Xp::award((int) $c->user_id, "$type:$page", Xp::POINTS[$type], $c->id);
            }
        });

        Comment::deleted(fn (Comment $c) => Xp::revokeComment($c->id));
    }

    private static function page(Comment $c): ?string
    {
        $thread = $c->commentable;

        return match (true) {
            $thread instanceof BlogCommentThread => 'blog/'.$thread->slug,
            $thread instanceof RoadmapCommentThread => 'roadmap/'.$thread->key,
            default => null,
        };
    }
}
