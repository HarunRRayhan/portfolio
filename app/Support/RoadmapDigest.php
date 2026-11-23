<?php

namespace App\Support;

use App\Models\RoadmapProgress;
use App\Models\User;
use App\Models\XpAward;
use Illuminate\Support\Carbon;

/** What one learner sees in the weekly roadmap progress email. */
final class RoadmapDigest
{
    /** Someone idle for longer than this gets no more nudges. */
    private const IDLE_DAYS = 30;

    public function __construct(private RoadmapRepository $repo) {}

    /**
     * @return array{xpTotal: int, xpWeek: int, lessonsWeek: int, idle: bool, roadmaps: list<array<string, mixed>>}|null
     *                                                                                                                   null when there is nothing to say: no unfinished roadmap, or too long idle.
     */
    public function for(User $user, Carbon $now): ?array
    {
        $progress = RoadmapProgress::where('user_id', $user->id)->get(['roadmap_slug', 'step_id', 'completed_at'])->groupBy('roadmap_slug');
        if ($progress->isEmpty()) {
            return null;
        }

        $weekAgo = $now->copy()->subDays(7);
        $last = $progress->flatten()->max('completed_at');
        $lessonsWeek = $progress->flatten()->filter(fn ($p) => $p->completed_at->gt($weekAgo))->count();
        if ($lessonsWeek === 0 && $last->lt($now->copy()->subDays(self::IDLE_DAYS))) {
            return null;
        }

        $canPaid = RoadmapAccess::canAccessPaid($user);
        $roadmaps = [];
        foreach ($progress as $slug => $rows) {
            $roadmap = $this->repo->find($slug);
            if (! $roadmap) {
                continue;
            }
            $done = $rows->pluck('step_id')->all();
            $required = $next = null;
            $total = $finished = 0;
            foreach ($roadmap['stages'] as $stage) {
                $open = $stage['free'] || $canPaid;
                foreach ($stage['topics'] as $topic) {
                    foreach ($topic['lessons'] as $lesson) {
                        if ($lesson['optional']) {
                            continue;
                        }
                        $total++;
                        if (in_array($lesson['id'], $done, true)) {
                            $finished++;
                        } elseif ($next === null) {
                            $next = ['title' => $lesson['title'], 'url' => $open ? $this->repo->topicUrl($slug, $topic['id']).'/'.$lesson['id'] : $this->repo->absoluteUrl($slug)];
                        }
                    }
                }
            }
            if ($total === 0 || $next === null) {
                continue; // finished
            }
            $roadmaps[] = [
                'title' => $roadmap['title'], 'url' => $this->repo->absoluteUrl($slug), 'done' => $finished, 'total' => $total,
                'percent' => (int) round($finished / $total * 100), 'next' => $next,
            ];
        }
        if ($roadmaps === []) {
            return null;
        }

        return [
            'xpTotal' => (int) XpAward::where('user_id', $user->id)->sum('points'),
            'xpWeek' => (int) XpAward::where('user_id', $user->id)->where('created_at', '>', $weekAgo)->sum('points'),
            'lessonsWeek' => $lessonsWeek,
            'idle' => $lessonsWeek === 0,
            'roadmaps' => $roadmaps,
        ];
    }
}
