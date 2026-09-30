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
     * Reuse only the caller's own links. Shared admin/model deduplication
     * must not expose another owner's title, expiry, or private statistics.
     */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'destination_url' => ['required', 'url', 'max:2048'],
            'title' => ['nullable', 'string', 'max:255'],
            'expires_at' => ['nullable', 'date', 'after:now'],
        ]);

        if (! preg_match('#^https?://#i', $data['destination_url'])) {
            return response()->json([
                'message' => 'destination_url must be a shortenable http(s) URL.',
                'errors' => ['destination_url' => ['destination_url must be a shortenable http(s) URL.']],
            ], 422);
        }

        $userId = $request->user()->id;
        $link = null;
        // Reusing a row reads its metadata, so creation alone cannot dedupe.
        if ($request->user()->currentAccessToken()->can('short-links:read')) {
            $existing = ShortLink::findForUrl($data['destination_url']);
            $link = $existing && $existing->user_id === $userId ? $existing : null;
            $link ??= ShortLink::query()->where('user_id', $userId)
                ->where('url_hash', ShortLink::hashFor($data['destination_url']))->first();
        }
        $link ??= ShortLink::create([
            'destination_url' => $data['destination_url'],
            'title' => $data['title'] ?? null,
            'expires_at' => $data['expires_at'] ?? null,
            'user_id' => $userId,
        ]);
        $link->refresh();

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
        $this->authorizeModification($request, $link);

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
