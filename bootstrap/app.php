<?php

use App\Http\Middleware\CheckRole;
use App\Http\Middleware\EnsureTermsAccepted;
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\LimitContentCrawls;
use App\Http\Middleware\NoindexPrivatePaths;
use App\Http\Middleware\RedirectTrailingSlash;
use App\Http\Middleware\TrustCloudflareClientIp;
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
        // Railway sits behind Cloudflare, which terminates TLS, so trust the
        // proxy for scheme/port only. X-Forwarded-For is client-forgeable and
        // is NOT trusted: the client IP comes from CF-Connecting-IP via
        // TrustCloudflareClientIp, which is safe only while the origin stays
        // Cloudflare-only (CLAUDE.md, Infra). HOST and PREFIX stay untrusted so a
        // spoofed X-Forwarded-Host cannot control generated links.
        $middleware->trustProxies(
            at: '*',
            headers: Request::HEADER_X_FORWARDED_PORT
                | Request::HEADER_X_FORWARDED_PROTO,
        );

        // Prepended so the real IP is set before throttle middleware reads it.
        $middleware->prepend(TrustCloudflareClientIp::class);

        // Global so the framework /up health route gets the header too.
        $middleware->append(NoindexPrivatePaths::class);

        // Runs before session/CSRF so trailing-slash URLs are normalized to
        // their canonical (slash-free) form with a 301 before any real work.
        $middleware->web(prepend: [
            RedirectTrailingSlash::class,
        ]);

        $middleware->web(append: [
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
            LimitContentCrawls::class,
            EnsureTermsAccepted::class,
        ]);

        // Signed-in users hitting guest routes (/login, magic links): /admin/dashboard is admin-only.
        $middleware->redirectUsersTo(fn (Request $request) => route($request->user()?->isAdmin() ? 'dashboard' : 'blog.index'));

        $middleware->alias([
            'role' => CheckRole::class,
        ]);

        // These endpoints are called without a CSRF token (client-side beacons).
        $middleware->validateCsrfTokens(except: [
            'blog/*/view',
            'bio/click',
            'github/sponsors/webhook',
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })->create();
