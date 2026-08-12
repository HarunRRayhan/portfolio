<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        // Runs before session/CSRF so trailing-slash URLs are normalized to
        // their canonical (slash-free) form with a 301 before any real work.
        $middleware->web(prepend: [
            \App\Http\Middleware\RedirectTrailingSlash::class,
        ]);

        $middleware->web(append: [
            \App\Http\Middleware\HandleInertiaRequests::class,
            \Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets::class,
        ]);

        $middleware->alias([
            'role' => \App\Http\Middleware\CheckRole::class,
        ]);

        // These endpoints are called without a CSRF token (client-side beacons).
        $middleware->validateCsrfTokens(except: [
            'blog/*/view',
            'bio/click',
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })->create();
