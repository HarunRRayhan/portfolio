<?php

namespace App\Support;

/**
 * Old Hashnode URLs on blog.harun.dev, and the copies of those paths that
 * Google already fetched on harun.dev. Post slugs keep a one-hop move to
 * /blog/{slug}. Tag, page, and feed indexes have no page here, so they go
 * to the blog index or the feed instead of a 404.
 */
final class LegacyBlogRedirect
{
    public const ORIGIN = 'https://harun.dev';

    public static function absoluteUrl(?string $path, ?string $query = null): string
    {
        $target = self::ORIGIN.self::canonicalPath($path);

        if (is_string($query) && $query !== '') {
            $target .= '?'.$query;
        }

        return $target;
    }

    /**
     * harun.dev path for a blog.harun.dev path. The path may be empty.
     */
    public static function canonicalPath(?string $path): string
    {
        $path = trim((string) $path, '/');

        if ($path === '' || $path === 'blog') {
            return '/blog';
        }

        if ($path === 'sitemap.xml') {
            return '/sitemap.xml';
        }

        if (self::isFeed($path)) {
            return '/blog/feed.xml';
        }

        if (self::isArchive($path) || self::isBuildAsset($path) || self::isBlogNoise($path)) {
            return '/blog';
        }

        if (str_starts_with($path, 'blog/')) {
            $path = substr($path, strlen('blog/'));
        }

        return '/blog/'.$path;
    }

    /**
     * Redirect target for a path already on harun.dev, or null when the path
     * is not a legacy alias.
     */
    public static function harunAlias(string $path): ?string
    {
        $path = trim($path, '/');

        if (in_array($path, ['feed', 'rss', 'blog/feed', 'blog/rss', 'blog/rss.xml'], true)) {
            return '/blog/feed.xml';
        }

        if ($path === 'blog/sponsor') {
            return '/sponsor-me';
        }

        if ($path === 'blog/archive' || $path === 'blog/tag' || str_starts_with($path, 'blog/tag/')) {
            return '/blog';
        }

        if ($path === 'blog/page' || str_starts_with($path, 'blog/page/')) {
            return '/blog';
        }

        if (self::isBlogNoise($path)) {
            return '/blog';
        }

        return null;
    }

    /**
     * Next.js chunks, fonts and Cloudflare email-obfuscation paths that the
     * old host served. They have no equivalent here, and Google keeps
     * re-crawling the ones it already knows.
     */
    private static function isBuildAsset(string $path): bool
    {
        return str_starts_with($path, '_next/')
            || str_starts_with($path, 'cdn-cgi/')
            || $path === '$'
            || str_starts_with($path, '$/');
    }

    /**
     * Copies of those old asset paths, plus hostnames that leaked into a post
     * body as a relative link (`console.aws.amazon.com/iamv2/home`).
     */
    private static function isBlogNoise(string $path): bool
    {
        if (! str_starts_with($path, 'blog/')) {
            return false;
        }

        $rest = substr($path, strlen('blog/'));

        if (self::isBuildAsset($rest)) {
            return true;
        }

        $slug = explode('/', $rest)[0];

        return str_contains($slug, '.');
    }

    private static function isFeed(string $path): bool
    {
        return in_array($path, [
            'rss',
            'rss.xml',
            'feed',
            'feed.xml',
            'atom.xml',
            'blog/feed',
            'blog/rss',
            'blog/rss.xml',
        ], true);
    }

    private static function isArchive(string $path): bool
    {
        if (in_array($path, ['tag', 'page', 'archive', 'author', 'newsletter'], true)) {
            return true;
        }

        foreach (['tag/', 'page/', 'archive/', 'author/', 'newsletter/', 'blog/tag/', 'blog/page/'] as $prefix) {
            if (str_starts_with($path, $prefix)) {
                return true;
            }
        }

        return false;
    }
}
