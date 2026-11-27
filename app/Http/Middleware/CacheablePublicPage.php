<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Lets Cloudflare cache anonymous HTML for a short allowlist of public pages.
 *
 * Cloudflare will not cache a response that sets cookies, and every Laravel page response
 * sets a session and an XSRF cookie. For a visitor with no cookies at all this middleware
 * keeps the session in memory (no database row per hit), drops the cookies, and marks the
 * response `public, s-maxage`. Anyone who already has a session or remember-me cookie is
 * left alone, so signed-in pages are never marked public. A matching Cloudflare cache rule
 * must also bypass on those cookies; this header alone caches nothing without that rule.
 * The client fetches /sanctum/csrf-cookie before its first form POST (lib/csrfCookie.ts).
 */
class CacheablePublicPage
{
    private const PATHS = '#^(?:about|products|raystack|privacy|terms|(?:services|case-studies|blog)(?:/[a-z0-9-]+)?)?$#';

    private const TRACKING_PARAMS = '/^(?:utm_[a-z0-9_]+|fbclid|gclid)$/';

    public function handle(Request $request, Closure $next): Response
    {
        if (! $this->eligible($request)) {
            return $next($request);
        }

        config(['session.driver' => 'array']);

        $response = $next($request);

        // Defensive: if anything authenticated this request, keep it private.
        if ($request->user() !== null) {
            return $response;
        }

        foreach ($response->headers->getCookies() as $cookie) {
            $response->headers->removeCookie($cookie->getName(), $cookie->getPath(), $cookie->getDomain());
        }

        if ($response->getStatusCode() === 200) {
            $response->headers->set('Cache-Control', 'public, max-age=0, s-maxage=300, stale-while-revalidate=600');
        }

        return $response;
    }

    private function eligible(Request $request): bool
    {
        // Any session or remember-me cookie means a possibly signed-in visitor.
        // CompleteLogin always remembers, so a remember cookie can outlive the session.
        if ($request->cookies->has((string) config('session.cookie'))
            || array_filter(array_keys($request->cookies->all()), fn ($name) => str_starts_with((string) $name, 'remember_')) !== []) {
            return false;
        }

        return $request->isMethod('GET')
            && ! $request->headers->has('X-Inertia')
            && preg_match(self::PATHS, trim($request->path(), '/')) === 1
            && array_filter(array_keys($request->query()), fn ($key) => preg_match(self::TRACKING_PARAMS, (string) $key) !== 1) === [];
    }
}
