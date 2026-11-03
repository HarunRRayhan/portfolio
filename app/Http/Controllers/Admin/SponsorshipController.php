<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\GithubSponsorship;
use App\Services\Sponsorship\CancelSponsorBookings;
use App\Services\Sponsorship\SponsorCreditService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class SponsorshipController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Admin/Sponsorships/Index', [
            'sponsorships' => GithubSponsorship::query()
                ->with(['user:id,name,email', 'credits.booking:id,public_id,starts_at,status'])
                ->orderByDesc('created_at')->orderByDesc('id')
                ->paginate(25)
                ->through(fn (GithubSponsorship $s) => [
                    'id' => $s->id,
                    'github_login' => $s->github_login,
                    'github_sponsor_id' => $s->github_sponsor_id,
                    'grant_email' => $s->grant_email,
                    'user' => $s->user ? ['name' => $s->user->name, 'email' => $s->user->email] : null,
                    'tier_slug' => $s->tier_slug,
                    'kind' => $s->kind,
                    'status' => $s->status,
                    'source' => $s->source,
                    'started_at' => $s->started_at?->toIso8601String(),
                    'credits' => $s->credits->map(fn ($c) => [
                        'id' => $c->id,
                        'kind' => $c->kind,
                        'expires_at' => $c->expires_at?->toIso8601String(),
                        'used_at' => $c->used_at?->toIso8601String(),
                        'revoked_at' => $c->revoked_at?->toIso8601String(),
                        'booking' => $c->booking ? [
                            'public_id' => $c->booking->public_id,
                            'starts_at' => $c->booking->starts_at?->toIso8601String(),
                            'status' => $c->booking->status,
                        ] : null,
                    ])->values(),
                ]),
            'tiers' => array_keys(config('sponsors.tiers')),
        ]);
    }

    public function store(Request $request, SponsorCreditService $credits): RedirectResponse
    {
        $data = $request->validate([
            'identifier' => ['required', 'string', 'max:255'],
            'tier_slug' => ['required', Rule::in(array_keys(config('sponsors.tiers')))],
            'expires_at' => ['nullable', 'date', 'after:now'],
            'sponsorship_id' => ['nullable', 'integer'],
        ]);

        $identifier = trim($data['identifier']);
        $existing = isset($data['sponsorship_id'])
            ? GithubSponsorship::query()->where('status', GithubSponsorship::STATUS_ACTIVE)->whereNull('tier_slug')->whereNotNull('github_sponsorship_node_id')->findOrFail($data['sponsorship_id'])
            : null;

        if ($existing) {
            // Upgrade the donation in place: same row, so the webhook's later replays stay idempotent.
            $attrs = [
                'github_sponsor_id' => $existing->github_sponsor_id,
                'github_login' => $existing->github_login,
                'github_tier_node_id' => $existing->github_tier_node_id,
                'source' => $existing->source,
                'grant_email' => $existing->grant_email,
                'started_at' => $existing->started_at,
                'github_sponsorship_node_id' => $existing->github_sponsorship_node_id,
            ];
        } elseif (filter_var($identifier, FILTER_VALIDATE_EMAIL)) {
            $attrs = [
                'github_sponsor_id' => 'manual:'.strtolower($identifier), // never equals a GitHub id
                'github_login' => $identifier,
                'grant_email' => $identifier,
            ];
        } else {
            $login = ltrim($identifier, '@');
            $user = preg_match('/^[A-Za-z0-9-]{1,39}$/', $login)
                ? Http::timeout(5)->get('https://api.github.com/users/'.$login) : null;
            if (! $user?->successful() || ! $user->json('id')) {
                throw ValidationException::withMessages(['identifier' => 'No GitHub user found for that login.']);
            }
            $attrs = ['github_sponsor_id' => (string) $user->json('id'), 'github_login' => $user->json('login', $login)];
        }

        $attrs += [
            'tier_slug' => $data['tier_slug'],
            'kind' => config("sponsors.tiers.{$data['tier_slug']}.kind"),
            'status' => GithubSponsorship::STATUS_ACTIVE,
            'source' => GithubSponsorship::SOURCE_MANUAL,
            'started_at' => now(),
            'expires_at' => $data['expires_at'] ?? null,
        ];
        $credits->recordSponsorship(array_filter($attrs, fn ($v) => $v !== null));

        return back()->with('flash', ['type' => 'success', 'message' => 'Credits granted.']);
    }

    // Manual lookup, not route binding: binding would run before role:admin (see NewsletterController::reveal).
    public function revoke(string $sponsorship, CancelSponsorBookings $cancel): RedirectResponse
    {
        $s = GithubSponsorship::findOrFail($sponsorship);
        if ($s->status !== GithubSponsorship::STATUS_ACTIVE) {
            return back()->with('flash', ['type' => 'error', 'message' => 'Only active sponsorships can be revoked.']);
        }
        $count = $cancel($s, GithubSponsorship::STATUS_REVOKED);

        return back()->with('flash', ['type' => 'success', 'message' => "Sponsorship revoked. {$count} future booking(s) cancelled."]);
    }
}
