<?php

namespace App\Support;

use App\Models\MediaItem;

final class PublicSitemap
{
    /**
     * @return list<array{loc: string, lastmod?: string}>
     */
    public static function entries(): array
    {
        $blog = new BlogRepository;
        $siteUrl = SiteCatalog::siteUrl();

        $staticUrls = collect(SiteCatalog::sitemapStaticPaths())->map(fn (string $path) => [
            'loc' => $siteUrl.$path,
        ]);

        $blogUrls = collect($blog->indexPosts())->map(fn (array $post) => [
            'loc' => $blog->absoluteUrl($post['slug']),
            'lastmod' => substr($post['lastModifiedAtIso'], 0, 10),
        ]);

        $caseStudyRepo = new CaseStudyRepository;
        $caseStudyUrls = collect($caseStudyRepo->indexStudies())->map(fn (array $study) => [
            'loc' => $caseStudyRepo->absoluteUrl($study['slug']),
            'lastmod' => substr($study['lastModifiedAtIso'], 0, 10),
        ]);

        $slideUrls = MediaItem::query()->active()->ofType('slide')->get()->map(fn (MediaItem $item) => self::datedEntry(
            $siteUrl.'/slides/'.$item->slug,
            $item->sitemapLastModified(),
        ));

        $videoUrls = MediaItem::query()->active()->ofType('video')->get()->map(fn (MediaItem $item) => self::datedEntry(
            $siteUrl.'/videos/'.$item->slug,
            $item->sitemapLastModified(),
        ));

        return $staticUrls
            ->merge($blogUrls)
            ->merge($caseStudyUrls)
            ->merge($slideUrls)
            ->merge($videoUrls)
            ->values()
            ->all();
    }

    /**
     * @return array{loc: string, lastmod?: string}
     */
    private static function datedEntry(string $loc, ?string $lastmod): array
    {
        $entry = ['loc' => $loc];

        if (is_string($lastmod) && $lastmod !== '') {
            $entry['lastmod'] = $lastmod;
        }

        return $entry;
    }

    /**
     * @return list<string>
     */
    public static function locations(): array
    {
        return array_values(array_map(
            fn (array $entry): string => $entry['loc'],
            self::entries(),
        ));
    }

    public static function xml(): string
    {
        $escape = fn (string $value): string => htmlspecialchars($value, ENT_XML1 | ENT_QUOTES, 'UTF-8');

        $entries = collect(self::entries())->map(function (array $url) use ($escape): string {
            $lastmod = is_string($url['lastmod'] ?? null) && $url['lastmod'] !== ''
                ? '      <lastmod>'.$escape($url['lastmod'])."</lastmod>\n"
                : '';

            return "    <url>\n"
                .'      <loc>'.$escape($url['loc'])."</loc>\n"
                .$lastmod
                .'    </url>';
        })->implode("\n");

        return <<<XML
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
{$entries}
</urlset>
XML;
    }
}
