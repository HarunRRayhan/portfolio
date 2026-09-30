<?php

namespace App\Support;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class LoginRedirectTarget
{
    public static function intended(Request $request, string $default): RedirectResponse
    {
        return redirect()->to(self::sanitize($request->session()->pull('url.intended')) ?? $default);
    }

    public static function sanitize(mixed $target): ?string
    {
        if (! is_string($target) || $target === '' || trim($target) !== $target) {
            return null;
        }

        $decoded = rawurldecode($target);
        if (preg_match('/[\\x00-\\x1f\\x7f\\\\\\\\]/', $decoded) || str_starts_with($decoded, '//')) {
            return null;
        }

        $url = parse_url($target);
        if ($url === false || isset($url['user']) || isset($url['pass'])) {
            return null;
        }

        if (str_starts_with($target, '/')) {
            return ! isset($url['host']) && ! isset($url['scheme']) ? $target : null;
        }

        $app = parse_url((string) config('app.url'));
        if (! is_array($app) || ! isset($url['scheme'], $url['host'], $app['scheme'], $app['host'])) {
            return null;
        }

        $scheme = strtolower($url['scheme']);
        if (! in_array($scheme, ['http', 'https'], true)
            || $scheme !== strtolower($app['scheme'])
            || strcasecmp($url['host'], $app['host']) !== 0
            || ($url['port'] ?? ($scheme === 'https' ? 443 : 80)) !== ($app['port'] ?? ($scheme === 'https' ? 443 : 80))) {
            return null;
        }

        return $target;
    }
}
