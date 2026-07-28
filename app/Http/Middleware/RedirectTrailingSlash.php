<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RedirectTrailingSlash
{
    /**
     * Normalize trailing-slash URLs to their canonical, slash-free form.
     *
     * Canonical <link> tags are rendered client-side by Inertia/React, so the
     * raw HTML Google crawls never carries them. Without a real HTTP redirect,
     * "/blog/some-post/" and "/blog/some-post" both return 200 with identical
     * content, which Search Console flags as "Duplicate without user-selected
     * canonical". A 301 to the slash-free URL gives crawlers one authority.
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Only touch safe, cacheable navigations. POST/PUT/DELETE form
        // submissions and beacons must never be bounced by a redirect.
        if ($request->isMethod('GET') || $request->isMethod('HEAD')) {
            $path = $request->getPathInfo();

            // Skip the homepage ("/"): there is no trailing slash to strip.
            // Everything else that ends in "/" is redirected to the same URL
            // without it, preserving scheme, host, and the query string.
            if ($path !== '/' && str_ends_with($path, '/')) {
                $query = $request->getQueryString();
                $target = rtrim($request->url(), '/').($query !== null ? '?'.$query : '');

                return redirect()->to($target, 301);
            }
        }

        return $next($request);
    }
}
