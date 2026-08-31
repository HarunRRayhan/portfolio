<?php

namespace App\Support;

/**
 * CDN URLs for static media (images, blog/service/case-study assets).
 *
 * Intentionally does NOT rewrite /build/* — Vite hashes are built in GitHub
 * Actions and served same-origin from Railway so the manifest always matches.
 */
final class Cdn
{
    public const DEFAULT_PRODUCTION_BASE = 'https://cdn.harun.dev';

    /**
     * @var list<string>
     */
    private const SAME_ORIGIN_PREFIXES = [
        'build/',
    ];

    public static function baseUrl(): string
    {
        return rtrim((string) config('services.assets.base_url', ''), '/');
    }

    public static function url(string $path): string
    {
        $path = '/'.ltrim($path, '/');
        $relative = ltrim($path, '/');

        foreach (self::SAME_ORIGIN_PREFIXES as $prefix) {
            if (str_starts_with($relative, $prefix)) {
                return asset($path);
            }
        }

        $base = self::baseUrl();

        if ($base === '') {
            return asset($path);
        }

        return $base.$path;
    }

    /**
     * Rewrite root-relative media paths in HTML bodies to the CDN.
     */
    public static function rewriteHtml(string $html): string
    {
        $base = self::baseUrl();

        if ($base === '') {
            return $html;
        }

        $rewritten = preg_replace(
            '#(?<=(?:src|href)=["\'])/(blog-assets|service-assets|case-studies-assets|images)/#i',
            $base.'/$1/',
            $html,
        );

        return is_string($rewritten) ? $rewritten : $html;
    }
}
