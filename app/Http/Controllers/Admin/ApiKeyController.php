<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\PersonalAccessToken;
use App\Support\ApiCapabilities;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Validation\Rule;
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
            'capabilities' => ApiCapabilities::SCOPES,
            'presets' => ApiCapabilities::PRESETS,
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
            'abilities' => ['required', 'array', 'min:1'],
            'abilities.*' => ['required', 'string', 'distinct', Rule::in(array_keys(ApiCapabilities::SCOPES))],
            'expires_at' => ['nullable', 'date', 'after:now'],
            'rate_limit_per_minute' => ['nullable', 'integer', 'min:1'],
            'rate_limit_per_day' => ['nullable', 'integer', 'min:1'],
        ]);

        // Omitted expiry defaults to 90 days; an explicit null means no expiry.
        $expiry = array_key_exists('expires_at', $data)
            ? ($data['expires_at'] ? Carbon::parse($data['expires_at'])->utc() : null)
            : now()->addDays(90);
        $newToken = $request->user()->createToken($data['name'], $data['abilities'], $expiry);

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
            'abilities' => $token->abilities,
            'is_legacy_unrestricted' => in_array('*', $token->abilities ?? [], true),
            'expires_at' => $token->expires_at?->toIso8601String(),
            'rate_limit_per_minute' => $token->rate_limit_per_minute,
            'rate_limit_per_day' => $token->rate_limit_per_day,
            'last_used_at' => $token->last_used_at?->toIso8601String(),
            'created_at' => $token->created_at?->toIso8601String(),
        ];
    }
}
