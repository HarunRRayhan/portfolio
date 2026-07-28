<?php

namespace App\Providers;

use Illuminate\Support\Facades\URL;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\Facades\View;
use Illuminate\Support\ServiceProvider;

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
        $httpsHosts = collect([config('app.url'), config('app.preview_url')])
            ->filter(fn ($url) => is_string($url) && str_starts_with($url, 'https://'))
            ->map(fn ($url) => parse_url($url, PHP_URL_HOST))
            ->filter();

        if ($httpsHosts->contains(request()->getHost())) {
            URL::forceScheme('https');
        }

        Vite::prefetch(concurrency: 3);

        if ($path = env('VIEW_COMPILED_PATH')) {
            View::addNamespace('views', $path);
        }
    }
}
