<?php

namespace App\Providers;

use App\Models\PersonalAccessToken;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Facades\View;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;
use Laravel\Sanctum\Sanctum;
use Inertia\Inertia;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Roll out server rendering only on the verified public homepage.
        Inertia::disableSsr(fn () => ! request()->is('/') || request()->user() !== null);

        // The homepage already has HTML. Give its stylesheet priority over
        // hydration downloads, without postponing interactive code execution.
        Vite::useScriptTagAttributes(fn () => request()->is('/') && request()->user() === null ? ['fetchpriority' => 'low'] : []);
        Vite::usePreloadTagAttributes(fn ($src, $url) => request()->is('/') && request()->user() === null && str_ends_with($url, '.js')
            ? ['fetchpriority' => 'low']
            : []);
        Vite::useStyleTagAttributes(fn () => \App\Support\HomepageStyles::available()
            ? [
                'media' => 'print',
                'data-deferred-app-styles' => true,
                'onload' => "this.media='all';this.onload=null",
                'onerror' => "this.dataset.failed='true';this.media='all'",
            ]
            : []);

        $httpsHosts = collect([config('app.url'), config('app.preview_url')])
            ->filter(fn ($url) => is_string($url) && str_starts_with($url, 'https://'))
            ->map(fn ($url) => parse_url($url, PHP_URL_HOST))
            ->filter();

        if ($httpsHosts->contains(request()->getHost())) {
            URL::forceScheme('https');
        }

        if ($path = env('VIEW_COMPILED_PATH')) {
            View::addNamespace('views', $path);
        }

        Sanctum::usePersonalAccessTokenModel(PersonalAccessToken::class);

        // Per-token API rate limits, keyed by the token id (never by IP) so
        // rotating keys can't be used to dodge the limit. Unauthenticated
        // requests never reach this limiter -- auth:sanctum rejects them
        // with a 401 first in the api/v1 middleware group.
        RateLimiter::for('api-key', function (Request $request) {
            $token = $request->user()?->currentAccessToken();

            return [
                Limit::perMinute($token?->rate_limit_per_minute ?? 60)->by('token:'.$token?->id),
                Limit::perDay($token?->rate_limit_per_day ?? 2000)->by('token:'.$token?->id),
            ];
        });
    }
}
