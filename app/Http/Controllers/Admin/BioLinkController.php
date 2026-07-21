<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\BioLink;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
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

    public function store(Request $request): RedirectResponse
    {
        BioLink::create($this->validateData($request));

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
        $bioLink->update($this->validateData($request));

        return redirect()->route('admin.bio.index')->with('flash', [
            'type' => 'success',
            'message' => 'Bio link updated.',
        ]);
    }

    public function destroy(BioLink $bioLink): RedirectResponse
    {
        $bioLink->delete();

        return redirect()->route('admin.bio.index')->with('flash', [
            'type' => 'success',
            'message' => 'Bio link deleted.',
        ]);
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
            'url' => ['required', 'string', 'max:2048'],
            'icon' => ['required', 'string', 'max:60'],
            'tab' => ['nullable', 'string', 'max:60'],
            'priority' => ['nullable', 'integer', 'min:0', 'max:65535'],
            'expires_at' => ['nullable', 'date'],
            'is_active' => ['boolean'],
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
            'url' => $link->url,
            'icon' => $link->icon,
            'tab' => $link->tab,
            'tab_slug' => $link->tab_slug,
            'priority' => $link->priority,
            'expires_at' => $link->expires_at?->format('Y-m-d\TH:i'),
            'is_active' => (bool) $link->is_active,
            'clicks_count' => (int) ($link->clicks_count ?? 0),
        ];
    }
}
