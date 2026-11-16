<?php

namespace App\Http\Middleware;

use App\Http\Controllers\Auth\AgreementController;
use App\Models\Subscriber;
use App\Models\XpAward;
use App\Support\CaseStudyRepository;
use App\Support\ContentLinks;
use App\Support\SeoCatalog;
use App\Support\SeoMeta;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Inertia\Middleware;
use Throwable;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $caseStudies = new CaseStudyRepository;

        $seo = SeoCatalog::forRequest($request);

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $request->user(),
                'isAdmin' => (bool) $request->user()?->isAdmin(),
                'xp' => fn () => $request->user() ? (int) XpAward::where('user_id', $request->user()->id)->sum('points') : null,
            ],
            'turnstileSiteKey' => config('services.turnstile.site_key'),
            'sponsorsUrl' => config('sponsors.url'),
            'caseStudiesByService' => fn () => $request->is('services/*')
                ? array_intersect_key($caseStudies->groupedByServiceSlug(), [$request->segment(2) => true])
                : [],
            'serviceReading' => fn () => $request->is('services/*')
                ? ContentLinks::readingForService((string) $request->segment(2))
                : [],
            'relatedServices' => fn () => $request->is('services/*')
                ? ContentLinks::relatedServices((string) $request->segment(2))
                : [],
            'featuredCaseStudies' => fn () => $request->is('/') ? $caseStudies->featured(3) : [],
            'newsletter' => [
                // Signed-in readers whose account email already gets the newsletter never see the idle popup.
                'accountSubscribed' => fn (): bool => (bool) ($request->user()?->email_verified_at && $request->user()->email && Subscriber::isSubscribed($request->user()->email)),
                'offerAfterSignup' => fn (): bool => (bool) ($request->user() && $request->session()->pull(AgreementController::NEWSLETTER_OFFER_KEY, false)),
                'subscriberCount' => function (): int {
                    try {
                        return (int) Cache::remember(
                            'newsletter.subscriber_count',
                            now()->addMinutes(5),
                            fn () => Subscriber::reachable()->count(),
                        );
                    } catch (Throwable) {
                        // Keep public pages renderable during a first boot
                        // before the subscriber migration has run.
                        return 0;
                    }
                },
            ],
            // Pages already read usePage().props.flash (Contact.tsx, Bio.tsx)
            // for the ->with('flash', [...]) convention used across admin
            // controllers, but nothing was actually sharing it as an Inertia
            // prop -- add it here so that convention works everywhere,
            // including the new admin/api-keys "here's your token" flash.
            'flash' => fn () => $request->session()->get('flash'),
            'xp' => fn () => $request->session()->get('xp'),
            'seo' => $seo?->toArray(),
            'siteJsonLd' => [SeoMeta::organizationGraph()],
            'canonicalUrl' => $seo?->canonicalUrl,
        ];
    }
}
