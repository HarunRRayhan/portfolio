<?php

namespace App\Http\Controllers;

use App\Models\RoadmapProgress;
use App\Models\RoadmapReaction;
use App\Models\RoadmapStart;
use App\Models\User;
use App\Support\RoadmapAccess;
use App\Support\RoadmapRepository;
use App\Support\SeoCatalog;
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
                [$percent, $next] = $this->progress($roadmap, $this->doneIds($user, $roadmap['slug']), $paid);
                $mine[] = [
                    'slug' => $roadmap['slug'],
                    'title' => $roadmap['title'],
                    'percent' => $percent,
                    'started' => $isStarted,
                    'saved' => $isSaved,
                    'continueStepId' => $next,
                ];
            }
        }

        return Inertia::render('Roadmaps/Index', [
            'roadmaps' => array_map(fn (array $r) => [
                'slug' => $r['slug'],
                'title' => $r['title'],
                'summary' => $r['summary'],
                'stepCount' => count($this->repo->stepIds($r)),
                'levels' => array_column($r['stages'], 'level'),
                'loveCount' => (int) ($loves[$r['slug']] ?? 0),
                'viewCount' => (int) ($views[$r['slug']] ?? 0),
                'buildsOn' => $this->buildsOn($r),
                'updatedAt' => (string) $r['updated'],
            ], $this->repo->all()),
            'mine' => $mine,
            'canonicalUrl' => SeoCatalog::forPath('/roadmaps')?->canonicalUrl ?? url('/roadmaps'),
            'seo' => SeoCatalog::forPath('/roadmaps')?->toArray(),
        ]);
    }

    public function show(Request $request, string $slug): Response
    {
        $roadmap = $this->roadmapOr404($slug);
        $user = $request->user();
        $paid = RoadmapAccess::canAccessPaid($user);
        $done = $user ? $this->doneIds($user, $slug) : [];
        $canonicalUrl = $this->repo->absoluteUrl($slug);

        $stages = array_map(function (array $stage) use ($roadmap, $paid, $done) {
            $locked = ! $paid && $stage['level'] !== RoadmapRepository::FREE_LEVEL;

            return [
                'level' => $stage['level'],
                'title' => $stage['title'] ?? ucfirst($stage['level']),
                'locked' => $locked,
                'steps' => array_map(function (array $step) use ($roadmap, $stage, $locked, $done) {
                    $base = [
                        'id' => $step['id'],
                        'title' => $step['title'],
                        'summary' => $step['summary'],
                        'done' => ! $locked && in_array($step['id'], $done, true),
                    ];
                    // Locked topics never send their content, so view-source shows nothing extra.
                    if ($locked) {
                        return $base;
                    }
                    $prompt = $this->repo->prompt($roadmap, $stage['level'], $step);

                    return $base + [
                        'learn' => $step['learn'],
                        'resources' => $step['resources'],
                        'searchUrl' => $this->repo->searchUrl($roadmap, $step),
                        'prompt' => $prompt,
                        'claudeUrl' => 'https://claude.ai/new?q='.urlencode($prompt),
                        'chatgptUrl' => 'https://chatgpt.com/?q='.urlencode($prompt),
                    ];
                }, $stage['steps']),
            ];
        }, $roadmap['stages']);

        $reactions = $user
            ? RoadmapReaction::where('user_id', $user->id)->where('roadmap_slug', $slug)->pluck('type')->all()
            : [];

        return Inertia::render('Roadmaps/Show', [
            'roadmap' => ['slug' => $slug, 'title' => $roadmap['title'], 'summary' => $roadmap['summary'], 'buildsOn' => $this->buildsOn($roadmap), 'updatedAt' => (string) $roadmap['updated']],
            'stages' => $stages,
            'hasPaidAccess' => $paid,
            'started' => $user ? RoadmapStart::where('user_id', $user->id)->where('roadmap_slug', $slug)->exists() : false,
            'loved' => in_array(RoadmapReaction::LOVE, $reactions, true),
            'saved' => in_array(RoadmapReaction::WISHLIST, $reactions, true),
            'loveCount' => RoadmapReaction::where('roadmap_slug', $slug)->where('type', RoadmapReaction::LOVE)->count(),
            'percent' => $this->progress($roadmap, $done, $paid)[0],
            'viewCount' => (int) DB::table('roadmap_views')->where('roadmap_slug', $slug)->value('count'),
            'canonicalUrl' => $canonicalUrl,
            'seo' => SeoCatalog::forMedia($roadmap['title'].' roadmap | Harun R. Rayhan', $roadmap['summary'], $canonicalUrl)->toArray(),
        ]);
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

    public function complete(Request $request, string $slug, string $step): RedirectResponse
    {
        $this->openStepOr404($request, $slug, $step);
        $user = $request->user();
        RoadmapStart::firstOrCreate(['user_id' => $user->id, 'roadmap_slug' => $slug]);
        RoadmapProgress::firstOrCreate(
            ['user_id' => $user->id, 'roadmap_slug' => $slug, 'step_id' => $step],
            ['completed_at' => now()],
        );

        return back();
    }

    public function uncomplete(Request $request, string $slug, string $step): RedirectResponse
    {
        $this->openStepOr404($request, $slug, $step);
        RoadmapProgress::where(['user_id' => $request->user()->id, 'roadmap_slug' => $slug, 'step_id' => $step])->delete();

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

    private function openStepOr404(Request $request, string $slug, string $step): void
    {
        $level = $this->repo->stepIds($this->roadmapOr404($slug))[$step] ?? null;
        abort_unless($level, 404);
        abort_if($level !== RoadmapRepository::FREE_LEVEL && ! RoadmapAccess::canAccessPaid($request->user()), 403);
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

    /** @return list<string> */
    private function doneIds(User $user, string $slug): array
    {
        return RoadmapProgress::where('user_id', $user->id)->where('roadmap_slug', $slug)->pluck('step_id')->all();
    }

    /**
     * Percent of the topics this user can open that they ticked, and the first unticked one.
     *
     * @return array{0: int, 1: ?string}
     */
    private function progress(array $roadmap, array $done, bool $paid): array
    {
        $open = array_keys(array_filter(
            $this->repo->stepIds($roadmap),
            fn (string $level) => $paid || $level === RoadmapRepository::FREE_LEVEL,
        ));
        $ticked = array_intersect($open, $done);
        $next = collect($open)->first(fn ($id) => ! in_array($id, $done, true));

        return [$open ? (int) round(count($ticked) * 100 / count($open)) : 0, $next];
    }
}
