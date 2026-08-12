<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\PersonalAccessToken;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ApiKeyController extends Controller
{
    /**
     * The acting admin's own keys. There's no way to show a plaintext token
     * again once created, so this only ever exposes metadata.
     */
    public function index(Request $request): Response
    {
        return Inertia::render('Admin/ApiKeys/Index', [
            'tokens' => $request->user()->tokens()
                ->orderByDesc('id')
                ->get()
                ->map(fn (PersonalAccessToken $token) => $this->toPayload($token))
                ->all(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'rate_limit_per_minute' => ['nullable', 'integer', 'min:1'],
            'rate_limit_per_day' => ['nullable', 'integer', 'min:1'],
        ]);

        $newToken = $request->user()->createToken($data['name'], ['*']);

        $newToken->accessToken->forceFill([
            'rate_limit_per_minute' => $data['rate_limit_per_minute'] ?? null,
            'rate_limit_per_day' => $data['rate_limit_per_day'] ?? null,
        ])->save();

        // Plaintext token is only ever available right here, right now --
        // Sanctum stores just the hash. Flashed once for the frontend to
        // show in a copy-to-clipboard box, then it's gone for good.
        return redirect()->route('admin.api-keys.index')->with('flash', [
            'type' => 'success',
            'message' => 'API key created. Copy it now, it will not be shown again.',
            'token' => $newToken->plainTextToken,
        ]);
    }

    public function destroy(Request $request, string $id): RedirectResponse
    {
        $deleted = $request->user()->tokens()->where('id', $id)->delete();

        abort_unless($deleted, 404);

        return redirect()->route('admin.api-keys.index')->with('flash', [
            'type' => 'success',
            'message' => 'API key revoked.',
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function toPayload(PersonalAccessToken $token): array
    {
        return [
            'id' => $token->id,
            'name' => $token->name,
            'rate_limit_per_minute' => $token->rate_limit_per_minute,
            'rate_limit_per_day' => $token->rate_limit_per_day,
            'last_used_at' => $token->last_used_at?->toIso8601String(),
            'created_at' => $token->created_at?->toIso8601String(),
        ];
    }
}
