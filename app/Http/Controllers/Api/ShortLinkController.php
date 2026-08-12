<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ShortLink;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ShortLinkController extends Controller
{
    /**
     * Create (or, per the existing url_hash dedup rule, reuse) a short link
     * for destination_url. The token owner is stamped as the link's user_id
     * only the first time it's actually created -- a reused link keeps
     * whichever owner (or nobody) it already had.
     */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'destination_url' => ['required', 'url', 'max:2048'],
            'title' => ['nullable', 'string', 'max:255'],
            'expires_at' => ['nullable', 'date', 'after:now'],
        ]);

        $link = ShortLink::getOrCreateForUrl($data['destination_url'], $data['title'] ?? null);

        if (! $link) {
            return response()->json([
                'message' => 'destination_url must be a shortenable http(s) URL.',
                'errors' => ['destination_url' => ['destination_url must be a shortenable http(s) URL.']],
            ], 422);
        }

        if ($link->wasRecentlyCreated) {
            $link->user_id = $request->user()->id;

            if (! empty($data['expires_at'])) {
                $link->expires_at = $data['expires_at'];
            }

            $link->save();

            // Eloquent doesn't repopulate DB column defaults (e.g. is_active)
            // into the in-memory model after the initial INSERT, so pull the
            // row back to get the true persisted state for the response.
            $link->refresh();
        }

        return response()->json($this->toPayload($link), 201);
    }

    /**
     * The caller's own links, paginated -- or every link, for an admin key.
     */
    public function index(Request $request): AnonymousResourceCollection|JsonResponse
    {
        $query = ShortLink::query()->orderByDesc('id');

        if (! $request->user()->isAdmin()) {
            $query->where('user_id', $request->user()->id);
        }

        $links = $query->paginate();
        $links->getCollection()->transform(fn (ShortLink $link) => $this->toPayload($link));

        return response()->json($links);
    }

    public function show(Request $request, string $code): JsonResponse
    {
        $link = $this->findOrFail($code);

        return response()->json($this->toPayload($link) + [
            'click_count' => $link->clicks()->count(),
        ]);
    }

    public function deactivate(Request $request, string $code): JsonResponse
    {
        $link = $this->findOrFail($code);
        $this->authorizeModification($request, $link);

        $link->update(['is_active' => false]);

        return response()->json($this->toPayload($link));
    }

    public function destroy(Request $request, string $code): JsonResponse
    {
        $link = $this->findOrFail($code);
        $this->authorizeModification($request, $link);

        $link->delete();

        return response()->json(null, 204);
    }

    private function findOrFail(string $code): ShortLink
    {
        $link = ShortLink::where('code', $code)->first();

        abort_unless($link, 404);

        return $link;
    }

    /**
     * Owner or admin only. A null-owner link (legacy/admin-created) is
     * admin-only, since nobody but an admin ever "owns" it.
     */
    private function authorizeModification(Request $request, ShortLink $link): void
    {
        $user = $request->user();

        abort_unless($link->user_id === $user->id || $user->isAdmin(), 403);
    }

    /**
     * @return array<string, mixed>
     */
    private function toPayload(ShortLink $link): array
    {
        return [
            'code' => $link->code,
            'short_url' => $link->short_url,
            'destination_url' => $link->destination_url,
            'title' => $link->title,
            'is_active' => (bool) $link->is_active,
            'expires_at' => $link->expires_at?->toIso8601String(),
            'qr_code_url' => route('api.v1.qr-codes.store', [
                'content' => $link->short_url,
                'format' => 'png',
            ]),
        ];
    }
}
