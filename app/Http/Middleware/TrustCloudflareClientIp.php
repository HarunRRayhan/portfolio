<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class TrustCloudflareClientIp
{
    // Safe only while the origin is reachable through Cloudflare alone (see CLAUDE.md, Infra).
    public function handle(Request $request, Closure $next)
    {
        $ip = $request->header('CF-Connecting-IP');

        if (is_string($ip) && filter_var($ip, FILTER_VALIDATE_IP)) {
            $request->server->set('REMOTE_ADDR', $ip);
        }

        return $next($request);
    }
}
