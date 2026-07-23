<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\BioLink;
use App\Models\BioLinkClick;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class BioLinkController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Admin/Bio/Index', [
            'links' => BioLink::query()
                ->withCount('clicks')
                ->orderBy('priority')
                ->orderBy('id')
                ->get()
                ->map(fn (BioLink $link) => $this->toPayload($link))
                ->all(),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/Bio/Create');
    }

    /**
     * Click analytics over a trailing window (default 30 days).
     */
    public function analytics(Request $request): Response
    {
        $days = (int) $request->integer('days', 30);
        $days = in_array($days, [7, 30, 90], true) ? $days : 30;

        $since = now()->subDays($days - 1)->startOfDay();

        $clicks = BioLinkClick::query()->where('created_at', '>=', $since);

        return Inertia::render('Admin/Bio/Analytics', [
            'days' => $days,
            'totalClicks' => BioLinkClick::count(),
            'windowClicks' => (clone $clicks)->count(),
            'daily' => $this->dailySeries($since, $days),
            'byLink' => $this->clicksByLink($since),
            'byCountry' => $this->groupCounts((clone $clicks), 'country'),
            'byReferer' => $this->refererCounts((clone $clicks)),
        ]);
    }

    /**
     * One row per day in the window, including days with no clicks -- a bar
     * chart with gaps silently rescales the x axis and misreads as continuous.
     *
     * @return list<array{date: string, clicks: int}>
     */
    private function dailySeries(\DateTimeInterface $since, int $days): array
    {
        $counts = BioLinkClick::query()
            ->where('created_at', '>=', $since)
            ->selectRaw('date(created_at) as day, count(*) as clicks')
            ->groupBy('day')
            ->pluck('clicks', 'day');

        return collect(range(0, $days - 1))
            ->map(function (int $offset) use ($since, $counts) {
                $date = Carbon::parse($since)->addDays($offset)->toDateString();

                return [
                    'date' => $date,
                    'clicks' => (int) ($counts[$date] ?? 0),
                ];
            })
            ->all();
    }

    /**
     * @return list<array{id: int, label: string, icon: string, clicks: int}>
     */
    private function clicksByLink(\DateTimeInterface $since): array
    {
        return BioLink::query()
            ->withCount(['clicks as clicks' => fn ($q) => $q->where('created_at', '>=', $since)])
            ->orderByDesc('clicks')
            ->get()
            ->map(fn (BioLink $link) => [
                'id' => $link->id,
                'label' => $link->label,
                'icon' => $link->icon,
                'clicks' => (int) $link->clicks,
            ])
            ->all();
    }

    /**
     * @return list<array{key: string, clicks: int}>
     */
    private function groupCounts(Builder $query, string $column): array
    {
        return $query
            ->whereNotNull($column)
            ->selectRaw("{$column} as key, count(*) as clicks")
            ->groupBy($column)
            ->orderByDesc('clicks')
            ->limit(10)
            ->get()
            ->map(fn ($row) => ['key' => (string) $row->key, 'clicks' => (int) $row->clicks])
            ->all();
    }

    /**
     * Referers are grouped by host: the full URL fragments the counts into
     * near-duplicates that say nothing about where traffic came from.
     *
     * @return list<array{key: string, clicks: int}>
     */
    private function refererCounts(Builder $query): array
    {
        return $query
            ->whereNotNull('referer')
            ->pluck('referer')
            ->map(fn (?string $url) => $url ? (parse_url($url, PHP_URL_HOST) ?: null) : null)
            ->filter()
            ->countBy()
            ->sortDesc()
            ->take(10)
            ->map(fn (int $clicks, string $host) => ['key' => $host, 'clicks' => $clicks])
            ->values()
            ->all();
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validateData($request);
        unset($data['remove_thumbnail'], $data['thumbnail']); // 'thumbnail' is the raw upload, not a column

        if ($request->hasFile('thumbnail')) {
            $data['thumbnail_path'] = $request->file('thumbnail')->store('bio-thumbnails', 'public');
        }

        BioLink::create($data);

        return redirect()->route('admin.bio.index')->with('flash', [
            'type' => 'success',
            'message' => 'Bio link created.',
        ]);
    }

    public function edit(BioLink $bioLink): Response
    {
        return Inertia::render('Admin/Bio/Edit', [
            'link' => $this->toPayload($bioLink),
        ]);
    }

    public function update(Request $request, BioLink $bioLink): RedirectResponse
    {
        $data = $this->validateData($request);
        $removeThumbnail = (bool) ($data['remove_thumbnail'] ?? false);
        unset($data['remove_thumbnail'], $data['thumbnail']);

        // A newly uploaded file always wins over "remove"; both replace the
        // old stored file, so the delete only ever targets what's on disk now.
        if ($request->hasFile('thumbnail')) {
            $this->deleteThumbnail($bioLink);
            $data['thumbnail_path'] = $request->file('thumbnail')->store('bio-thumbnails', 'public');
        } elseif ($removeThumbnail) {
            $this->deleteThumbnail($bioLink);
            $data['thumbnail_path'] = null;
        }

        $bioLink->update($data);

        return redirect()->route('admin.bio.index')->with('flash', [
            'type' => 'success',
            'message' => 'Bio link updated.',
        ]);
    }

    public function destroy(BioLink $bioLink): RedirectResponse
    {
        $this->deleteThumbnail($bioLink);
        $bioLink->delete();

        return redirect()->route('admin.bio.index')->with('flash', [
            'type' => 'success',
            'message' => 'Bio link deleted.',
        ]);
    }

    private function deleteThumbnail(BioLink $bioLink): void
    {
        if ($bioLink->thumbnail_path) {
            Storage::disk('public')->delete($bioLink->thumbnail_path);
        }
    }

    /**
     * Toggle the active state of a single link (used by the index toggle switch).
     */
    public function toggle(BioLink $bioLink): RedirectResponse
    {
        $bioLink->update(['is_active' => ! $bioLink->is_active]);

        return redirect()->back();
    }

    /**
     * Persist a new ordering. Expects an ordered array of link ids; the array
     * index becomes the priority (lower priority sorts first).
     */
    public function reorder(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'ids' => ['required', 'array'],
            'ids.*' => ['integer', 'exists:bio_links,id'],
        ]);

        foreach ($data['ids'] as $index => $id) {
            BioLink::where('id', $id)->update(['priority' => $index + 1]);
        }

        return redirect()->back();
    }

    /**
     * @return array<string, mixed>
     */
    private function validateData(Request $request): array
    {
        return $request->validate([
            'label' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:255'],
            'url' => ['required', 'string', 'max:2048'],
            'icon' => ['required', 'string', 'max:60'],
            'thumbnail' => ['nullable', 'image', 'max:2048'],
            'remove_thumbnail' => ['nullable', 'boolean'],
            'featured' => ['nullable', 'boolean'],
            'tab' => ['nullable', 'string', 'max:60'],
            'priority' => ['nullable', 'integer', 'min:0', 'max:65535'],
            'expires_at' => ['nullable', 'date'],
            'is_active' => ['boolean'],
            'include_countries' => ['nullable', 'array'],
            'include_countries.*' => ['string', 'size:2', 'alpha'],
            'exclude_countries' => ['nullable', 'array'],
            'exclude_countries.*' => ['string', 'size:2', 'alpha'],
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function toPayload(BioLink $link): array
    {
        return [
            'id' => $link->id,
            'label' => $link->label,
            'description' => $link->description,
            'url' => $link->url,
            'icon' => $link->icon,
            'thumbnail_url' => $link->thumbnail_url,
            'featured' => (bool) $link->featured,
            'tab' => $link->tab,
            'tab_slug' => $link->tab_slug,
            'priority' => $link->priority,
            'expires_at' => $link->expires_at?->format('Y-m-d\TH:i'),
            'is_active' => (bool) $link->is_active,
            'include_countries' => $link->include_countries ?? [],
            'exclude_countries' => $link->exclude_countries ?? [],
            'clicks_count' => (int) ($link->clicks_count ?? 0),
        ];
    }
}
