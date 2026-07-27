<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Admin\Concerns\HasClickAnalytics;
use App\Http\Controllers\Controller;
use App\Models\ShortLink;
use App\Models\ShortLinkClick;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ShortLinkController extends Controller
{
    use HasClickAnalytics;

    public function index(): Response
    {
        return Inertia::render('Admin/Short/Index', [
            'links' => ShortLink::query()
                ->withCount('clicks')
                ->orderByDesc('id')
                ->get()
                ->map(fn (ShortLink $link) => $this->toPayload($link))
                ->all(),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/Short/Create');
    }

    /**
     * Click analytics over a trailing window (default 30 days). Pass ?link=
     * to scope every figure to a single short link instead of all of them.
     */
    public function analytics(Request $request): Response
    {
        $days = (int) $request->integer('days', 30);
        $days = in_array($days, [7, 30, 90], true) ? $days : 30;

        $linkId = $request->integer('link') ?: null;
        $selectedLink = $linkId ? ShortLink::find($linkId) : null;

        $since = now()->subDays($days - 1)->startOfDay();

        $scoped = fn (Builder $query) => $linkId ? $query->where('short_link_id', $linkId) : $query;

        $clicks = $scoped(ShortLinkClick::query())->where('created_at', '>=', $since);

        return Inertia::render('Admin/Short/Analytics', [
            'days' => $days,
            'links' => ShortLink::query()->orderByDesc('id')->get(['id', 'code', 'title'])
                ->map(fn (ShortLink $l) => ['id' => $l->id, 'code' => $l->code, 'title' => $l->title])
                ->all(),
            'selectedLinkId' => $linkId,
            'totalClicks' => $scoped(ShortLinkClick::query())->count(),
            'windowClicks' => (clone $clicks)->count(),
            'daily' => $this->dailySeries($scoped(ShortLinkClick::query()), $since, $days),
            'byLink' => $linkId ? [] : $this->clicksByLink(ShortLink::query(), $since, fn (ShortLink $link) => [
                'id' => $link->id,
                'code' => $link->code,
                'title' => $link->title,
                'clicks' => (int) $link->clicks,
            ]),
            'byCountry' => $this->groupCounts((clone $clicks), 'country'),
            'byReferer' => $this->refererCounts((clone $clicks)),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validateData($request);

        // A blank code means "just shorten this URL" -- check for an existing
        // link first so the same destination doesn't end up with two codes.
        // A custom code is a deliberate vanity alias, so it always creates.
        if (empty($data['code']) && ShortLink::findForUrl($data['destination_url'])) {
            return redirect()->route('admin.short.index')->with('flash', [
                'type' => 'info',
                'message' => 'That URL is already shortened, so we reused the existing link.',
            ]);
        }

        ShortLink::create($data);

        return redirect()->route('admin.short.index')->with('flash', [
            'type' => 'success',
            'message' => 'Short link created.',
        ]);
    }

    public function edit(ShortLink $shortLink): Response
    {
        return Inertia::render('Admin/Short/Edit', [
            'link' => $this->toPayload($shortLink),
        ]);
    }

    public function update(Request $request, ShortLink $shortLink): RedirectResponse
    {
        $data = $this->validateData($request, $shortLink);

        $shortLink->update($data);

        return redirect()->route('admin.short.index')->with('flash', [
            'type' => 'success',
            'message' => 'Short link updated.',
        ]);
    }

    public function destroy(ShortLink $shortLink): RedirectResponse
    {
        $shortLink->delete();

        return redirect()->route('admin.short.index')->with('flash', [
            'type' => 'success',
            'message' => 'Short link deleted.',
        ]);
    }

    /**
     * Toggle the active state of a single link (used by the index toggle switch).
     */
    public function toggle(ShortLink $shortLink): RedirectResponse
    {
        $shortLink->update(['is_active' => ! $shortLink->is_active]);

        return redirect()->back();
    }

    /**
     * @return array<string, mixed>
     */
    private function validateData(Request $request, ?ShortLink $shortLink = null): array
    {
        return $request->validate([
            'destination_url' => ['required', 'url', 'max:2048'],
            // A code can be left blank on create (one is generated), but once a
            // link exists its code can't be cleared out from under it.
            'code' => [
                $shortLink ? 'required' : 'nullable',
                'string',
                'alpha_dash',
                'max:60',
                Rule::unique('short_links', 'code')->ignore($shortLink?->id),
            ],
            'title' => ['nullable', 'string', 'max:255'],
            'expires_at' => ['nullable', 'date'],
            'is_active' => ['boolean'],
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function toPayload(ShortLink $link): array
    {
        return [
            'id' => $link->id,
            'code' => $link->code,
            'destination_url' => $link->destination_url,
            'title' => $link->title,
            'short_url' => $link->short_url,
            'is_active' => (bool) $link->is_active,
            'expires_at' => $link->expires_at?->format('Y-m-d\TH:i'),
            'clicks_count' => (int) ($link->clicks_count ?? 0),
            'created_at' => $link->created_at?->toIso8601String(),
        ];
    }
}
