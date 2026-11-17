<?php

namespace App\Http\Controllers;

use App\Models\RoadmapCommentThread;
use App\Models\RoadmapProgress;
use App\Models\RoadmapReaction;
use App\Models\RoadmapStart;
use App\Models\User;
use App\Support\RoadmapAccess;
use App\Support\RoadmapRepository;
use App\Support\SeoCatalog;
use App\Support\Xp;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class RoadmapController extends Controller
{
    public function __construct(private RoadmapRepository $repo) {}

    public function index(Request $request): Response
    {
        $user = $request->user();
        $paid = RoadmapAccess::canAccessPaid($user);
        $loves = RoadmapReaction::query()->where('type', RoadmapReaction::LOVE)
            ->selectRaw('roadmap_slug, count(*) as n')->groupBy('roadmap_slug')->pluck('n', 'roadmap_slug');
        $views = DB::table('roadmap_views')->pluck('count', 'roadmap_slug');

        $mine = [];
        if ($user) {
            $started = RoadmapStart::where('user_id', $user->id)->pluck('roadmap_slug')->all();
            $saved = RoadmapReaction::where('user_id', $user->id)->where('type', RoadmapReaction::WISHLIST)->pluck('roadmap_slug')->all();
            foreach ($this->repo->all() as $roadmap) {
                $isStarted = in_array($roadmap['slug'], $started, true);
                $isSaved = in_array($roadmap['slug'], $saved, true);
                if (! $isStarted && ! $isSaved) {
                    continue;
                }
                [$percent, $nextLesson] = $this->progress($roadmap, $this->doneIds($user, $roadmap['slug']), $paid);
                $mine[] = [
                    'slug' => $roadmap['slug'],
                    'title' => $roadmap['title'],
                    'percent' => $percent,
                    'started' => $isStarted,
                    'saved' => $isSaved,
                    'continueTopicId' => $nextLesson ? $this->repo->lessonIndex($roadmap)[$nextLesson]['topic'] : null,
                ];
            }
        }

        return Inertia::render('Roadmaps/Index', [
            'categories' => RoadmapRepository::CATEGORIES,
            'roadmaps' => array_map(fn (array $r) => [
                'slug' => $r['slug'],
                'title' => $r['title'],
                'summary' => $r['summary'],
                'category' => $r['category'] ?? null,
                'topicCount' => array_sum(array_map(fn ($st) => count($st['topics']), $r['stages'])),
                'lessonCount' => count($this->repo->lessonIndex($r)),
                'levels' => array_column($r['stages'], 'level'),
                'loveCount' => (int) ($loves[$r['slug']] ?? 0),
                'viewCount' => (int) ($views[$r['slug']] ?? 0),
                'buildsOn' => $this->buildsOn($r),
                'updatedAt' => (string) $r['updated'],
                'art' => $this->art($r),
            ], $this->repo->all()),
            'mine' => $mine,
            'canonicalUrl' => SeoCatalog::forPath('/roadmaps')?->canonicalUrl ?? url('/roadmaps'),
            'seo' => SeoCatalog::forPath('/roadmaps')?->toArray(),
        ]);
    }

    /** Lesson search for the roadmaps page: JSON, at most 20 hits. */
    public function search(Request $request)
    {
        $q = mb_substr(trim((string) $request->query('q')), 0, 80);
        $results = mb_strlen($q) < 2 ? [] : $this->repo->searchLessons($q, RoadmapAccess::canAccessPaid($request->user()));

        return response()->json(['results' => $results])->header('Cache-Control', 'private, no-store');
    }

    public function show(Request $request, string $slug): Response
    {
        $roadmap = $this->roadmapOr404($slug);
        $user = $request->user();
        $paid = RoadmapAccess::canAccessPaid($user);
        $done = $user ? $this->doneIds($user, $slug) : [];
        $canonicalUrl = $this->repo->absoluteUrl($slug);

        $lessons = $this->repo->lessonIndex($roadmap);
        $stages = array_map(function (array $stage) use ($paid, $done) {
            $locked = ! $paid && $stage['level'] !== RoadmapRepository::FREE_LEVEL;

            return [
                'level' => $stage['level'],
                'title' => $stage['title'],
                'locked' => $locked,
                'topics' => array_map(function (array $topic) use ($locked, $done) {
                    $required = array_column(array_filter($topic['lessons'], fn ($l) => ! $l['optional']), 'id');
                    $doneRequired = $locked ? 0 : count(array_intersect($required, $done));

                    return [
                        'id' => $topic['id'],
                        'title' => $topic['title'],
                        'summary' => $topic['summary'],
                        'lessonCount' => count($topic['lessons']),
                        'requiredCount' => count($required),
                        'doneCount' => $doneRequired,
                        'done' => ! $locked && $doneRequired === count($required),
                    ];
                }, $stage['topics']),
            ];
        }, $roadmap['stages']);
        [$percent, $nextLesson] = $this->progress($roadmap, $done, $paid);

        $reactions = $user
            ? RoadmapReaction::where('user_id', $user->id)->where('roadmap_slug', $slug)->pluck('type')->all()
            : [];

        return Inertia::render('Roadmaps/Show', [
            'roadmap' => ['slug' => $slug, 'title' => $roadmap['title'], 'summary' => $roadmap['summary'], 'buildsOn' => $this->buildsOn($roadmap), 'updatedAt' => (string) $roadmap['updated'], 'art' => $this->art($roadmap)],
            'hasAccount' => (bool) $user,
            'stages' => $stages,
            'hasPaidAccess' => $paid,
            'started' => $user ? RoadmapStart::where('user_id', $user->id)->where('roadmap_slug', $slug)->exists() : false,
            'loved' => in_array(RoadmapReaction::LOVE, $reactions, true),
            'saved' => in_array(RoadmapReaction::WISHLIST, $reactions, true),
            'loveCount' => RoadmapReaction::where('roadmap_slug', $slug)->where('type', RoadmapReaction::LOVE)->count(),
            'percent' => $percent,
            'nextTopicId' => $user && $nextLesson ? $lessons[$nextLesson]['topic'] : null,
            'viewCount' => (int) DB::table('roadmap_views')->where('roadmap_slug', $slug)->value('count'),
            'canonicalUrl' => $canonicalUrl,
            'seo' => SeoCatalog::forMedia($roadmap['title'].' roadmap | Harun R. Rayhan', $roadmap['summary'], $canonicalUrl)->toArray(),
        ] + $this->comments($slug, false));
    }

    public function topic(Request $request, string $slug, string $topicId): Response|RedirectResponse
    {
        $roadmap = $this->roadmapOr404($slug);
        $found = $this->repo->findTopic($roadmap, $topicId);
        abort_unless($found, 404);
        ['stage' => $stage, 'topic' => $topic, 'prev' => $prev, 'next' => $next] = $found;

        $user = $request->user();
        $locked = $stage['level'] !== RoadmapRepository::FREE_LEVEL && ! RoadmapAccess::canAccessPaid($user);
        if ($locked) {
            return redirect()->to("/roadmaps/{$slug}#unlock"); // paid topics and lessons stay fully closed
        }
        $done = $user ? $this->doneIds($user, $slug) : [];
        $canonicalUrl = $this->repo->topicUrl($slug, $topicId);

        $lessons = array_map(fn (array $lesson) => $this->lessonPayload($roadmap, $stage, $topic, $lesson, $locked, $done, (bool) $user), $topic['lessons']);

        $required = array_values(array_filter($lessons, fn ($l) => ! $l['optional']));
        $doneRequired = count(array_filter($required, fn ($l) => $l['done']));

        return Inertia::render('Roadmaps/Topic', [
            'roadmap' => ['slug' => $slug, 'title' => $roadmap['title']],
            'topic' => ['id' => $topic['id'], 'number' => $found['number'], 'title' => $topic['title'], 'summary' => $topic['summary'], 'level' => $stage['level'], 'stageTitle' => $stage['title']],
            'lessons' => $lessons,
            'locked' => $locked,
            'hasAccount' => (bool) $user,
            'percent' => $required ? (int) round($doneRequired * 100 / count($required)) : 0,
            'prev' => $prev ? ['id' => $prev['id'], 'title' => $prev['title']] : null,
            'next' => $next ? ['id' => $next['id'], 'title' => $next['title']] : null,
            'canonicalUrl' => $canonicalUrl,
            'seo' => SeoCatalog::forMedia($topic['title'].' · '.$roadmap['title'].' roadmap | Harun R. Rayhan', $topic['summary'], $canonicalUrl)->toArray(),
        ] + $this->comments("{$slug}/{$topicId}", $locked));
    }

    public function lesson(Request $request, string $slug, string $topicId, string $lessonId): Response|RedirectResponse
    {
        $roadmap = $this->roadmapOr404($slug);
        $found = $this->repo->findTopic($roadmap, $topicId);
        abort_unless($found, 404);
        ['stage' => $stage, 'topic' => $topic] = $found;
        $position = collect($topic['lessons'])->search(fn ($l) => $l['id'] === $lessonId);
        abort_if($position === false, 404);

        $user = $request->user();
        $locked = $stage['level'] !== RoadmapRepository::FREE_LEVEL && ! RoadmapAccess::canAccessPaid($user);
        if ($locked) {
            return redirect()->to("/roadmaps/{$slug}#unlock"); // paid topics and lessons stay fully closed
        }
        $done = $user ? $this->doneIds($user, $slug) : [];
        $lesson = $topic['lessons'][$position];
        $canonicalUrl = $this->repo->topicUrl($slug, $topicId).'/'.$lessonId;

        // Neighbours across the whole roadmap, so "next" moves on to the next topic's first lesson.
        $order = array_keys($this->repo->lessonIndex($roadmap));
        $index = $this->repo->lessonIndex($roadmap);
        $i = array_search($lessonId, $order, true);
        $neighbour = function (?string $id) use ($roadmap, $index): ?array {
            if ($id === null) {
                return null;
            }
            $found = $this->repo->findTopic($roadmap, $index[$id]['topic']);
            $l = collect($found['topic']['lessons'])->firstWhere('id', $id);

            return ['id' => $id, 'title' => $l['title'], 'topicId' => $found['topic']['id'], 'topicTitle' => $found['topic']['title'], 'topicNumber' => $found['number']];
        };

        return Inertia::render('Roadmaps/Lesson', [
            'roadmap' => ['slug' => $slug, 'title' => $roadmap['title']],
            'topic' => ['id' => $topic['id'], 'number' => $found['number'], 'title' => $topic['title'], 'level' => $stage['level']],
            'lesson' => $this->lessonPayload($roadmap, $stage, $topic, $lesson, $locked, $done, (bool) $user),
            'position' => $position + 1,
            'lessonCount' => count($topic['lessons']),
            // The topic's lessons, for the step list at the top of the page.
            'siblings' => array_map(fn (array $l) => ['id' => $l['id'], 'title' => $l['title'], 'optional' => $l['optional'], 'done' => in_array($l['id'], $done, true)], $topic['lessons']),
            'locked' => $locked,
            'hasAccount' => (bool) $user,
            'prev' => $neighbour($order[$i - 1] ?? null),
            'next' => $neighbour($order[$i + 1] ?? null),
            'canonicalUrl' => $canonicalUrl,
            'seo' => SeoCatalog::forMedia($lesson['title'].' · '.$topic['title'].' | Harun R. Rayhan', $lesson['summary'], $canonicalUrl)->toArray(),
        ] + $this->comments("{$slug}/{$topicId}/{$lessonId}", $locked));
    }

    /** @return array<string, mixed> */
    private function lessonPayload(array $roadmap, array $stage, array $topic, array $lesson, bool $locked, array $done, bool $signedIn): array
    {
        $base = [
            'id' => $lesson['id'],
            'title' => $lesson['title'],
            'optional' => $lesson['optional'],
            'done' => ! $locked && in_array($lesson['id'], $done, true),
        ];
        // Locked lessons never send their content, so view-source shows nothing extra.
        if ($locked) {
            return $base;
        }
        $base += [
            'summary' => $lesson['summary'],
            'learn' => $lesson['learn'],
            'bodyHtml' => $lesson['bodyHtml'],
            'resources' => $lesson['resources'],
            'searchUrl' => $this->repo->searchUrl($topic, $lesson),
        ];
        // The AI prompt is for signed-in readers only.
        if ($signedIn) {
            $base += ['prompt' => $this->repo->prompt($roadmap, $stage['level'], $topic, $lesson)];
        }

        return $base;
    }

    /** @return array{comments: list<array<string, mixed>>, commentCount: int} */
    private function comments(string $key, bool $locked): array
    {
        // Paid discussions stay with readers who can open the topic.
        $thread = $locked ? null : RoadmapCommentThread::findKey($key);

        return [
            'comments' => $thread ? $thread->tree() : [],
            'commentCount' => $thread ? $thread->comments()->count() : 0,
        ];
    }

    /** Called by the page after it loads, like blog post views, so crawlers and cached HTML don't count. */
    public function view(string $slug): JsonResponse
    {
        $this->roadmapOr404($slug);
        $now = now();
        DB::table('roadmap_views')->upsert(
            ['roadmap_slug' => $slug, 'count' => 1, 'created_at' => $now, 'updated_at' => $now],
            'roadmap_slug',
            ['count' => DB::raw('roadmap_views.count + 1'), 'updated_at' => $now],
        );

        return response()->json(['views' => (int) DB::table('roadmap_views')->where('roadmap_slug', $slug)->value('count')]);
    }

    public function start(Request $request, string $slug): RedirectResponse
    {
        $this->roadmapOr404($slug);
        RoadmapStart::firstOrCreate(['user_id' => $request->user()->id, 'roadmap_slug' => $slug]);

        return back();
    }

    public function complete(Request $request, string $slug, string $lesson): RedirectResponse
    {
        $this->openLessonOr404($request, $slug, $lesson);
        $user = $request->user();
        RoadmapStart::firstOrCreate(['user_id' => $user->id, 'roadmap_slug' => $slug]);
        RoadmapProgress::firstOrCreate(
            ['user_id' => $user->id, 'roadmap_slug' => $slug, 'step_id' => $lesson],
            ['completed_at' => now()],
        );
        $this->awardXp($user->id, $slug, $lesson);

        return back();
    }

    public function uncomplete(Request $request, string $slug, string $lesson): RedirectResponse
    {
        $this->openLessonOr404($request, $slug, $lesson);
        RoadmapProgress::where(['user_id' => $request->user()->id, 'roadmap_slug' => $slug, 'step_id' => $lesson])->delete();

        return back();
    }

    public function love(Request $request, string $slug): RedirectResponse
    {
        return $this->toggle($request, $slug, RoadmapReaction::LOVE);
    }

    public function wishlist(Request $request, string $slug): RedirectResponse
    {
        return $this->toggle($request, $slug, RoadmapReaction::WISHLIST);
    }

    private function toggle(Request $request, string $slug, string $type): RedirectResponse
    {
        $this->roadmapOr404($slug);
        $key = ['user_id' => $request->user()->id, 'roadmap_slug' => $slug, 'type' => $type];
        if (RoadmapReaction::where($key)->delete() === 0) {
            RoadmapReaction::firstOrCreate($key);
        }

        return back();
    }

    /** Required lessons earn XP once (kept on undo); finishing a topic's required lessons adds a bonus. */
    private function awardXp(int $userId, string $slug, string $lesson): void
    {
        $index = $this->repo->lessonIndex($this->repo->find($slug));
        if ($index[$lesson]['optional']) {
            return;
        }
        Xp::award($userId, "lesson:$slug/$lesson", Xp::POINTS['lesson']);

        $topic = $index[$lesson]['topic'];
        $required = array_keys(array_filter($index, fn ($l) => $l['topic'] === $topic && ! $l['optional']));
        $done = RoadmapProgress::where(['user_id' => $userId, 'roadmap_slug' => $slug])->whereIn('step_id', $required)->count();
        if ($done === count($required)) {
            Xp::award($userId, "topic:$slug/$topic", Xp::POINTS['topic']);
        }
    }

    private function openLessonOr404(Request $request, string $slug, string $lesson): void
    {
        $level = $this->repo->lessonIndex($this->roadmapOr404($slug))[$lesson]['level'] ?? null;
        abort_unless($level, 404);
        abort_if($level !== RoadmapRepository::FREE_LEVEL && ! RoadmapAccess::canAccessPaid($request->user()), 403);
    }

    /** @return array{icon: string, color: string, logos: list<string>} */
    private function art(array $roadmap): array
    {
        return ['icon' => (string) ($roadmap['icon'] ?? 'globe'), 'color' => (string) ($roadmap['color'] ?? 'amber'), 'logos' => array_values($roadmap['logos'] ?? [])];
    }

    /** @return array{slug: string, title: string}|null */
    private function buildsOn(array $roadmap): ?array
    {
        $parent = isset($roadmap['builds_on']) ? $this->repo->find((string) $roadmap['builds_on']) : null;

        return $parent ? ['slug' => $parent['slug'], 'title' => $parent['title']] : null;
    }

    /** @return array<string, mixed> */
    private function roadmapOr404(string $slug): array
    {
        $roadmap = $this->repo->find($slug);
        abort_unless($roadmap, 404);

        return $roadmap;
    }

    /** @return list<string> lesson ids (stored in step_id) */
    private function doneIds(User $user, string $slug): array
    {
        return RoadmapProgress::where('user_id', $user->id)->where('roadmap_slug', $slug)->pluck('step_id')->all();
    }

    /**
     * Percent of the required lessons this user can open that they ticked, and the first unticked one.
     * Optional lessons never hold back progress.
     *
     * @return array{0: int, 1: ?string}
     */
    private function progress(array $roadmap, array $done, bool $paid): array
    {
        $open = array_keys(array_filter(
            $this->repo->lessonIndex($roadmap),
            fn (array $l) => ! $l['optional'] && ($paid || $l['level'] === RoadmapRepository::FREE_LEVEL),
        ));
        $ticked = array_intersect($open, $done);
        $next = collect($open)->first(fn ($id) => ! in_array($id, $done, true));

        return [$open ? (int) round(count($ticked) * 100 / count($open)) : 0, $next];
    }
}
