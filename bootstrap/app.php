<?php

use App\Http\Middleware\CheckRole;
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\RedirectTrailingSlash;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        // Railway/Cloudflare terminate TLS in front of the app, so the
        // request that reaches PHP is plain HTTP from that proxy's point of
        // view. Trust it so getScheme()/URL::forceScheme() and the client
        // IP resolve correctly instead of generating http:// asset URLs.
        // Headers are scoped to FOR/PORT/PROTO (+AWS_ELB, which is just
        // those three) rather than the framework default, which also trusts
        // HOST and PREFIX — that would let a spoofed X-Forwarded-Host
        // control the host Laravel thinks it's on, including the links the
        // password-reset email builds from the request host.
        $middleware->trustProxies(
            at: '*',
            headers: Request::HEADER_X_FORWARDED_FOR
                | Request::HEADER_X_FORWARDED_PORT
                | Request::HEADER_X_FORWARDED_PROTO
                | Request::HEADER_X_FORWARDED_AWS_ELB,
        );

        // Runs before session/CSRF so trailing-slash URLs are normalized to
        // their canonical (slash-free) form with a 301 before any real work.
        $middleware->web(prepend: [
            RedirectTrailingSlash::class,
        ]);

        $middleware->web(append: [
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
        ]);

        $middleware->alias([
            'role' => CheckRole::class,
        ]);

        // These endpoints are called without a CSRF token (client-side beacons).
        $middleware->validateCsrfTokens(except: [
            'blog/*/view',
            'bio/click',
            'stripe/webhook',
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })->create();
