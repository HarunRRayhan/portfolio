<?php

namespace App\Support;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Inertia\Ssr\HttpGateway;
use Inertia\Ssr\Response;

/**
 * Node SSR adds about 200 ms to every HTML response on Railway. The output only
 * depends on the page object (props, URL, asset version), so identical pages
 * reuse the last render. Like LimitContentCrawls, a database default cache is
 * swapped for the container-local file store to keep this off Postgres.
 */
class CachedSsrGateway extends HttpGateway
{
    public function dispatch(array $page, ?Request $request = null): ?Response
    {
        $request ??= request();

        if (! $this->ssrIsEnabled($request)) {
            return null;
        }

        // Query strings are visitor-controlled; caching them would let anyone fill the disk.
        if ($request->getQueryString() !== null) {
            return parent::dispatch($page, $request);
        }

        $store = Cache::store(config('cache.default') === 'database' ? 'file' : null);
        $key = 'inertia.ssr.'.sha1((string) json_encode($page));
        $cached = $store->get($key);

        if (is_array($cached)) {
            return new Response($cached['head'], $cached['body']);
        }

        $response = parent::dispatch($page, $request);

        if ($response !== null) {
            // shortcut: expired files are only removed when read again; fine while each deploy starts a fresh container.
            $store->put($key, ['head' => $response->head, 'body' => $response->body], now()->addMinutes(10));
        }

        return $response;
    }
}
