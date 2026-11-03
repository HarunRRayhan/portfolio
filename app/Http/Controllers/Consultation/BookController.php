<?php

namespace App\Http\Controllers\Consultation;

use App\Http\Controllers\Controller;
use App\Models\ConsultationCredit;
use App\Models\ConsultationTier;
use App\Services\Consultation\AvailabilityService;
use App\Services\Consultation\BookingWorkflowService;
use App\Services\Sponsorship\SponsorCreditService;
use App\Support\SeoCatalog;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

class BookController extends Controller
{
    public function show(Request $request, SponsorCreditService $sponsorCredits): SymfonyResponse
    {
        $user = $request->user();
        $tiers = ConsultationTier::query()->active()->get()->map->toPublicArray()->values();
        if ($user) {
            $sponsorCredits->claimFor($user);
        }
        $credits = $user ? $sponsorCredits->usableCredits($user)->load('tier')->map(fn (ConsultationCredit $c) => [
            'id' => $c->id,
            'tier_slug' => $c->tier?->slug,
            'tier_name' => $c->tier?->name,
            'kind' => $c->kind,
            'expires_at' => $c->expires_at->toIso8601String(),
        ])->values() : [];
        $seo = SeoCatalog::forPath('/consultation')->toArray();
        $seo['jsonLd'] = [[
            '@context' => 'https://schema.org',
            '@type' => 'Service',
            'name' => 'Book a consult',
            'description' => 'Sponsor on GitHub, then book a time.',
            'provider' => [
                '@type' => 'Person',
                'name' => 'Harun R. Rayhan',
                'jobTitle' => 'DevOps consultant',
            ],
            'offers' => $tiers->map(fn (array $tier) => [
                '@type' => 'Offer',
                'name' => $tier['name'],
                'price' => number_format($tier['price_cents'] / 100, 2, '.', ''),
                'priceCurrency' => 'USD',
            ])->all(),
        ]];

        $response = Inertia::render('Book', [
            'tiers' => $tiers,
            'seo' => $seo,
            'minLeadHours' => (int) config('consultation.min_lead_hours', 48),
            'bufferMinutes' => (int) config('consultation.buffer_minutes', 15),
            'timezones' => \DateTimeZone::listIdentifiers(),
            'bookingUser' => $user ? ['name' => $user->name, 'email' => $user->email] : null,
            'credits' => $credits,
            'sponsorTiers' => collect(config('sponsors.tiers'))
                ->map(fn (array $t, string $slug) => ['slug' => $slug, 'url' => $t['url'] ?? null, 'kind' => $t['kind']])
                ->values(),
            'sponsorsUrl' => config('sponsors.url'),
            'contactUrl' => route('contact'),
            'contactEmail' => config('mail.owner.address'),
            'hasGithubIdentity' => $user !== null && ($user->provider_name === 'github'
                || DB::table('social_identities')->where('user_id', $user->id)->where('provider', 'github')->exists()),
            // shortcut: social.redirect is guest-only, so a signed-in user must sign out and use GitHub (same email) to link.
            'githubLinkUrl' => route('social.redirect', ['provider' => 'github', 'redirect' => $request->getRequestUri()]),
        ])->toResponse($request);
        $response->headers->set('Referrer-Policy', 'no-referrer');

        return $response;
    }

    public function availability(Request $request, AvailabilityService $availability): JsonResponse
    {
        $data = $request->validate([
            'tier' => ['required', 'string'],
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date'],
            'credit' => ['nullable', 'integer'],
        ]);

        $tier = ConsultationTier::query()->active()->where('slug', $data['tier'])->firstOrFail();
        $from = isset($data['from']) ? Carbon::parse($data['from'])->utc() : null;
        $to = isset($data['to']) ? Carbon::parse($data['to'])->utc() : null;

        if (isset($data['credit']) && $request->user()) {
            $expiresAt = ConsultationCredit::query()->where('user_id', $request->user()->id)
                ->whereKey($data['credit'])->value('expires_at');
            if ($expiresAt) {
                $expiresAt = Carbon::parse($expiresAt)->utc();
                $to = $to ? $to->min($expiresAt) : $expiresAt;
            }
        }

        return response()->json([
            'slots' => $availability->availableSlots($tier, $from, $to),
        ]);
    }

    public function store(Request $request, BookingWorkflowService $workflow): RedirectResponse
    {
        $website = $request->input('website');
        if (is_string($website) && ($website = trim($website)) !== '' && ! preg_match('#^[a-z][a-z0-9+.-]*://#i', $website)) {
            $request->merge(['website' => 'https://'.$website]);
        }

        $data = $request->validate([
            'credit_id' => ['required', 'integer', Rule::exists('consultation_credits', 'id')
                ->where('user_id', $request->user()->id)->where('kind', ConsultationCredit::KIND_CALL)],
            'client_name' => ['required', 'string', 'max:120'],
            'company_name' => ['required', 'string', 'max:255'],
            'website' => ['required', 'url:http,https', 'max:2048'],
            'notes' => ['required', 'string', 'max:5000'],
            'role' => ['nullable', 'string', 'max:120'],
            'team_size' => ['nullable', 'string', 'max:40'],
            'budget' => ['nullable', 'string', 'max:60'],
            'starts_at' => ['required', 'date'],
            'sa_ref' => config('consultation.skaleagents_handoff_enabled')
                ? ['nullable', 'regex:/^[A-Za-z0-9_-]{32}$/']
                : ['exclude'],
        ]);

        $credit = ConsultationCredit::query()->findOrFail($data['credit_id']);
        $tier = ConsultationTier::query()->active()->find($credit->consultation_tier_id);
        if (! $tier) {
            return back()->withErrors(['starts_at' => 'That plan is no longer offered. Please contact me.'])->withInput();
        }

        try {
            $result = $workflow->requestBooking(
                $tier,
                $data['client_name'],
                $request->user()->email,
                $data['notes'],
                Carbon::parse($data['starts_at'])->utc(),
                null,
                $data['company_name'],
                $data['sa_ref'] ?? null,
                [
                    'user_id' => $request->user()->id,
                    'website' => $data['website'],
                    'role' => $data['role'] ?? null,
                    'team_size' => $data['team_size'] ?? null,
                    'budget' => $data['budget'] ?? null,
                ],
                $credit,
            );
        } catch (\InvalidArgumentException $e) {
            return back()->withErrors(['starts_at' => $e->getMessage()])->withInput();
        } catch (\RuntimeException) {
            return back()->withErrors(['starts_at' => 'That slot is temporarily unavailable. Please try again.'])->withInput();
        }

        return redirect()
            ->to($result['booking']->accessUrl($result['plain_token']))
            ->with('flash', [
                'type' => 'success',
                'message' => 'Request submitted. We’ll email you when it’s reviewed.',
            ]);
    }
}
