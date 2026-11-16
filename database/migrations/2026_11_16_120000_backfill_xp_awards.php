<?php

use App\Models\BlogCommentThread;
use App\Models\RoadmapCommentThread;
use App\Support\RoadmapRepository;
use App\Support\Xp;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

// Credit what people did before XP existed, dated when they did it. insertOrIgnore keeps it re-runnable.
return new class extends Migration
{
    public function up(): void
    {
        $rows = [];
        $add = function ($user, string $key, int $points, $at, ?int $commentId = null) use (&$rows) {
            $rows[] = ['user_id' => $user, 'key' => $key, 'points' => $points, 'comment_id' => $commentId, 'created_at' => $at];
        };

        $users = DB::table('users')->get(['id', 'email', 'email_verified_at', 'created_at']);
        $subscribed = DB::table('subscribers')->where('status', 'subscribed')->get(['email', 'updated_at'])
            ->keyBy(fn ($s) => strtolower(trim($s->email)));
        foreach ($users as $u) {
            $add($u->id, 'signup', Xp::POINTS['signup'], $u->created_at ?? now());
            $sub = $u->email_verified_at ? $subscribed->get(strtolower(trim($u->email))) : null;
            if ($sub) {
                $add($u->id, 'newsletter', Xp::POINTS['newsletter'], $sub->updated_at ?? now());
            }
        }

        $repo = new RoadmapRepository;
        $progress = DB::table('roadmap_progress')->get()->groupBy(fn ($p) => $p->user_id.'|'.$p->roadmap_slug);
        foreach ($progress as $group) {
            $slug = $group[0]->roadmap_slug;
            $roadmap = $repo->find($slug);
            if (! $roadmap) {
                continue;
            }
            $index = $repo->lessonIndex($roadmap);
            $done = $group->keyBy('step_id');
            foreach ($done as $lesson => $p) {
                if (isset($index[$lesson]) && ! $index[$lesson]['optional']) {
                    $add($p->user_id, "lesson:$slug/$lesson", Xp::POINTS['lesson'], $p->completed_at);
                }
            }
            $byTopic = collect($index)->reject(fn ($l) => $l['optional'])->keys()->groupBy(fn ($id) => $index[$id]['topic']);
            foreach ($byTopic as $topic => $required) {
                if ($required->every(fn ($id) => $done->has($id))) {
                    $add($group[0]->user_id, "topic:$slug/$topic", Xp::POINTS['topic'], $required->map(fn ($id) => $done[$id]->completed_at)->max());
                }
            }
        }

        $pages = [
            (new BlogCommentThread)->getMorphClass() => DB::table('blog_comment_threads')->pluck('slug', 'id')->map(fn ($s) => "blog/$s"),
            (new RoadmapCommentThread)->getMorphClass() => DB::table('roadmap_comment_threads')->pluck('key', 'id')->map(fn ($k) => "roadmap/$k"),
        ];
        // On a fresh database the package's undated comments migration runs after this one.
        Schema::hasTable('comments') && DB::table('comments')->whereNull('deleted_at')->whereIn('user_id', DB::table('users')->select('id'))->orderBy('id')
            ->each(function ($c) use ($pages, $add) {
                $page = $pages[$c->commentable_type][$c->commentable_id] ?? null;
                if ($page) {
                    $type = $c->parent_id ? 'reply' : 'comment';
                    $add($c->user_id, "$type:$page", Xp::POINTS[$type], $c->created_at, $c->id); // first per page wins
                }
            });

        foreach (array_chunk($rows, 500) as $chunk) {
            DB::table('xp_awards')->insertOrIgnore($chunk);
        }
    }

    public function down(): void {}
};
