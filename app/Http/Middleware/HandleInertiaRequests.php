<?php

namespace App\Http\Middleware;

use App\Support\CaseStudyRepository;
use Illuminate\Http\Request;
use Inertia\Middleware;

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
        $caseStudies = new CaseStudyRepository();
        $byService = $caseStudies->groupedByServiceSlug();

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $request->user(),
            ],
            'caseStudiesByService' => $byService,
            'featuredCaseStudies' => $caseStudies->featured(3),
            // Pages already read usePage().props.flash (Contact.tsx, Bio.tsx)
            // for the ->with('flash', [...]) convention used across admin
            // controllers, but nothing was actually sharing it as an Inertia
            // prop -- add it here so that convention works everywhere,
            // including the new admin/api-keys "here's your token" flash.
            'flash' => fn () => $request->session()->get('flash'),
        ];
    }
}
