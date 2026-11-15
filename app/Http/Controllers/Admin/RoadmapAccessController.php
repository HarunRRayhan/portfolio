<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\RoadmapAccessGrant;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class RoadmapAccessController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Admin/RoadmapAccess/Index', [
            'grants' => RoadmapAccessGrant::query()->latest()->latest('id')->limit(500)->get()
                ->map(fn (RoadmapAccessGrant $g) => [
                    'id' => $g->id,
                    'email' => $g->email,
                    'note' => $g->note,
                    'expires_at' => $g->expires_at->toIso8601String(),
                    'revoked_at' => $g->revoked_at?->toIso8601String(),
                    'status' => $g->status(),
                ]),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email', 'max:255'],
            'expires_at' => ['required', 'date', 'after:today'],
            'note' => ['nullable', 'string', 'max:500'],
        ]);
        $email = strtolower($data['email']);

        RoadmapAccessGrant::create([
            'email' => $email,
            'user_id' => User::query()->whereRaw('lower(email) = ?', [$email])->value('id'),
            // The picked date is the last full day of access.
            'expires_at' => Carbon::parse($data['expires_at'])->endOfDay(),
            'note' => $data['note'] ?? null,
            'granted_by' => $request->user()->id,
        ]);

        return back()->with('success', "Roadmap access granted to {$email}.");
    }

    public function revoke(string $grant): RedirectResponse
    {
        // Manual lookup, not route binding: binding runs before role:admin.
        $grant = RoadmapAccessGrant::findOrFail($grant);
        $grant->revoked_at ??= now();
        $grant->save();

        return back()->with('success', "Access revoked for {$grant->email}.");
    }
}
