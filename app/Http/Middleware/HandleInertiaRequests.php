<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     * @param  \Illuminate\Http\Request  $request
     * @return string|null
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Defines the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     * @param  \Illuminate\Http\Request  $request
     * @return array
     */
    public function share(Request $request): array
    {
        return array_merge(parent::share($request), [
            'app' => [
                'name' => config('app.name'),
                'url' => config('app.url'),
            ],
            'flash' => [
                'type' => fn () => $request->session()->get('flash.type'),
                'message' => fn () => $request->session()->get('flash.message'),
            ],
            'auth' => [
                'user' => fn () => $request->user()
                    ? $request->user()->only('id', 'name', 'email')
                    : null,
            ],
            'ziggy' => [
                'location' => $request->url(),
            ],
            'seo' => [
                'title' => config('app.name'),
                'description' => 'Full-stack developer specializing in web development, cloud architecture, and DevOps.',
                'keywords' => 'web development, cloud architecture, DevOps, full-stack development, React, Laravel',
                'og_image' => asset('images/og-image.jpg'),
            ],
        ]);
    }
}
