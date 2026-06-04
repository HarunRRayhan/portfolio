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
        $canonicalHost = parse_url((string) config('app.url'), PHP_URL_HOST);

        if (
            $canonicalHost !== null
            && request()->getHost() === $canonicalHost
            && str_starts_with((string) config('app.url'), 'https://')
        ) {
            URL::forceScheme('https');
        }

        Vite::prefetch(concurrency: 3);

        if ($path = env('VIEW_COMPILED_PATH')) {
            View::addNamespace('views', $path);
        }
    }
}
