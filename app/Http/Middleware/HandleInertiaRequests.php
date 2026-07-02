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
        ];
    }
}
