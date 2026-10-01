<?php

namespace App\Http\Middleware;

use App\Support\AiCrawlerPolicy;
use App\Support\SiteCatalog;
use Closure;
use Illuminate\Contracts\Cache\Repository;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Symfony\Component\HttpFoundation\Response;

/**
 * Caps how fast one IP can read public pages.
 *
 * Counters live on the file cache when the default store is the database.
 * A per-page database write would add latency to every HTML response.
 */
class LimitContentCrawls
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! config('ai.crawl_limit_enabled')) {
            return $next($request);
        }

        if (! $request->isMethod('GET') && ! $request->isMethod('HEAD')) {
            return $next($request);
        }

        if ($request->user() !== null) {
            return $next($request);
        }

        $class = AiCrawlerPolicy::classify((string) $request->userAgent());
        $limit = AiCrawlerPolicy::perMinute($class);
        $key = 'content-crawl:'.AiCrawlerPolicy::clientAddress($request);
        $store = $this->counterStore();
        $now = time();
        $bucket = $store->get($key);

        if (! is_array($bucket) || (int) ($bucket['reset'] ?? 0) <= $now) {
            $bucket = ['count' => 0, 'reset' => $now + 60];
        }

        $count = (int) $bucket['count'];
        $reset = (int) $bucket['reset'];

        if ($count >= $limit) {
            $retry = max(1, $reset - $now);
            $site = SiteCatalog::siteUrl();

            return response(
                "Slow down. Read {$site}/llms.txt for the site index, then fetch specific pages.\n",
                429,
            )->withHeaders([
                'Retry-After' => (string) $retry,
                'Content-Type' => 'text/plain; charset=UTF-8',
                'Cache-Control' => 'private, no-store',
            ]);
        }

        $store->put($key, ['count' => $count + 1, 'reset' => $reset], max(1, $reset - $now));

        return $next($request);
    }

    private function counterStore(): Repository
    {
        $name = config('cache.default') === 'database' ? 'file' : (string) config('cache.default');

        return Cache::store($name);
    }
}
