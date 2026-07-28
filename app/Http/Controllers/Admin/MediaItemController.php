<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\MediaItem;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class MediaItemController extends Controller
{
    public function index(Request $request): Response
    {
        $type = $request->query('type');
        $type = in_array($type, ['slide', 'video'], true) ? $type : null;

        $items = MediaItem::query()
            ->when($type, fn ($query) => $query->ofType($type))
            ->orderBy('type')
            ->orderBy('priority')
            ->orderBy('id')
            ->get()
            ->map(fn (MediaItem $item) => $this->toPayload($item));

        return Inertia::render('Admin/Media/Index', [
            'items' => $items->all(),
            'filterType' => $type,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/Media/Create');
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validateData($request);
        unset($data['remove_thumbnail'], $data['thumbnail']); // 'thumbnail' is the raw upload, not a column

        if ($request->hasFile('thumbnail')) {
            $data['thumbnail_path'] = $request->file('thumbnail')->store('media-thumbnails', 'public');
        }

        MediaItem::create($data);

        return redirect()->route('admin.media.index')->with('flash', [
            'type' => 'success',
            'message' => 'Media item created.',
        ]);
    }

    public function edit(MediaItem $mediaItem): Response
    {
        return Inertia::render('Admin/Media/Edit', [
            'item' => $this->toPayload($mediaItem),
        ]);
    }

    public function update(Request $request, MediaItem $mediaItem): RedirectResponse
    {
        $data = $this->validateData($request);
        $removeThumbnail = (bool) ($data['remove_thumbnail'] ?? false);
        unset($data['remove_thumbnail'], $data['thumbnail']);

        // A newly uploaded file always wins over "remove"; both replace the
        // old stored file, so the delete only ever targets what's on disk now.
        if ($request->hasFile('thumbnail')) {
            $this->deleteThumbnail($mediaItem);
            $data['thumbnail_path'] = $request->file('thumbnail')->store('media-thumbnails', 'public');
        } elseif ($removeThumbnail) {
            $this->deleteThumbnail($mediaItem);
            $data['thumbnail_path'] = null;
        }

        $mediaItem->update($data);

        return redirect()->route('admin.media.index')->with('flash', [
            'type' => 'success',
            'message' => 'Media item updated.',
        ]);
    }

    public function destroy(MediaItem $mediaItem): RedirectResponse
    {
        $this->deleteThumbnail($mediaItem);
        $mediaItem->delete();

        return redirect()->route('admin.media.index')->with('flash', [
            'type' => 'success',
            'message' => 'Media item deleted.',
        ]);
    }

    private function deleteThumbnail(MediaItem $mediaItem): void
    {
        if ($mediaItem->thumbnail_path) {
            Storage::disk('public')->delete($mediaItem->thumbnail_path);
        }
    }

    /**
     * Toggle the active state of a single item (used by the index toggle switch).
     */
    public function toggle(MediaItem $mediaItem): RedirectResponse
    {
        $mediaItem->update(['is_active' => ! $mediaItem->is_active]);

        return redirect()->back();
    }

    /**
     * Persist a new ordering. Expects an ordered array of item ids; the array
     * index becomes the priority (lower priority sorts first).
     */
    public function reorder(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'ids' => ['required', 'array'],
            'ids.*' => ['integer', 'exists:media_items,id'],
        ]);

        foreach ($data['ids'] as $index => $id) {
            MediaItem::where('id', $id)->update(['priority' => $index + 1]);
        }

        return redirect()->back();
    }

    /**
     * @return array<string, mixed>
     */
    private function validateData(Request $request): array
    {
        return $request->validate([
            'type' => ['required', 'in:slide,video'],
            'title' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255'],
            'summary' => ['nullable', 'string'],
            'url' => ['required', 'string', 'max:2048', 'url'],
            'source_label' => ['nullable', 'string', 'max:255'],
            'thumbnail' => ['nullable', 'image', 'max:2048'],
            'remove_thumbnail' => ['nullable', 'boolean'],
            'published_at' => ['nullable', 'date'],
            'is_active' => ['boolean'],
            'priority' => ['nullable', 'integer', 'min:0', 'max:65535'],
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function toPayload(MediaItem $item): array
    {
        return [
            'id' => $item->id,
            'type' => $item->type,
            'title' => $item->title,
            'slug' => $item->slug,
            'summary' => $item->summary,
            'url' => $item->url,
            'share_url' => $item->share_url,
            'thumbnail_url' => $item->thumbnail_url,
            'source_label' => $item->source_label,
            'published_at' => $item->published_at?->format('Y-m-d\TH:i'),
            'is_active' => (bool) $item->is_active,
            'priority' => $item->priority,
            'short_link_code' => $item->shortLink?->code,
        ];
    }
}
