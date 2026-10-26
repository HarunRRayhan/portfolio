<?php

namespace App\Http\Middleware;

use App\Support\AiCrawlerPolicy;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class NoindexPrivatePaths
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        if (AiCrawlerPolicy::isPrivatePath($request->getPathInfo())) {
            $response->headers->set('X-Robots-Tag', 'noindex, nofollow');
        }

        return $response;
    }
}
