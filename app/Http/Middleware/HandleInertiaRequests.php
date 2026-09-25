<?php

namespace App\Http\Middleware;

use App\Models\Subscriber;
use App\Support\CaseStudyRepository;
use App\Support\SeoCatalog;
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
            ],
            'caseStudiesByService' => fn () => $request->is('services/*')
                ? array_intersect_key($caseStudies->groupedByServiceSlug(), [$request->segment(2) => true])
                : [],
            'featuredCaseStudies' => fn () => $request->is('/') ? $caseStudies->featured(3) : [],
            'newsletter' => [
                'subscriberCount' => function (): int {
                    try {
                        return (int) Cache::remember(
                            'newsletter.subscriber_count',
                            now()->addMinutes(5),
                            fn () => Subscriber::subscribed()->count(),
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
            'seo' => $seo?->toArray(),
            'canonicalUrl' => $seo?->canonicalUrl,
        ];
    }
}
