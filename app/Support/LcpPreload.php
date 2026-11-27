<?php

namespace App\Support;

/**
 * The hero image that is the LCP element on blog posts and service pages.
 *
 * Those pages are client-rendered, so the browser only finds the <img> after the JS
 * bundle runs. A <link rel="preload"> in the first HTML response starts the fetch at once.
 * The srcset and sizes mirror Blog/Post.tsx and ServiceHero.tsx so the browser picks the
 * same candidate the <img> will use; if they drift apart the preload is wasted.
 */
final class LcpPreload
{
    /**
     * @param  array<string, mixed>  $page  Inertia page payload
     * @return array{href: string, srcset: string, sizes: string}|null
     */
    public static function for(array $page, string $path): ?array
    {
        $component = (string) ($page['component'] ?? '');

        if ($component === 'Blog/Post') {
            return self::blogPost((array) data_get($page, 'props.post', []));
        }

        if (str_starts_with($component, 'Services/') && preg_match('#^services/([a-z0-9-]+)$#', trim($path, '/'), $m)) {
            return self::serviceHero($m[1]);
        }

        return null;
    }

    private static function blogPost(array $post): ?array
    {
        $cover = $post['coverImageUrl'] ?? null;

        if (! is_string($cover) || $cover === '') {
            return null;
        }

        $candidates = array_map(
            fn (array $source) => $source['url'].' '.$source['width'].'w',
            (array) ($post['coverImageSources'] ?? []),
        );
        $candidates[] = $cover.' 1600w';

        return ['href' => $cover, 'srcset' => implode(', ', $candidates), 'sizes' => '(min-width: 1280px) 1280px, 100vw'];
    }

    private static function serviceHero(string $slug): ?array
    {
        $path = "service-assets/{$slug}/hero.jpg";

        if (! is_file(public_path($path)) || ! is_file(public_path("service-assets/{$slug}/hero-800.jpg"))) {
            return null;
        }

        $href = Cdn::url($path);

        return [
            'href' => $href,
            'srcset' => Cdn::url("service-assets/{$slug}/hero-800.jpg").' 800w, '.$href.' 1600w',
            'sizes' => '100vw',
        ];
    }
}
