<?php

namespace App\Support;

/**
 * Local checks for the AI-readiness surface. Live fetches stay in the command.
 *
 * @phpstan-type Check array{ok: bool, required: bool, message: string}
 */
final class AiReadinessReport
{
    /**
     * @return list<Check>
     */
    public static function checks(): array
    {
        $siteUrl = SiteCatalog::siteUrl();
        $robots = AiCrawlerPolicy::robotsTxt($siteUrl);
        $brief = '';
        $briefBuilt = true;

        try {
            $brief = LlmSiteIndex::brief();
        } catch (\Throwable) {
            $briefBuilt = false;
        }

        $checks = [];

        $checks[] = self::check(
            str_contains($robots, 'Content-Signal: search=yes, ai-input=yes, ai-train=yes'),
            true,
            'robots.txt allows search, live AI answers, and training.',
        );

        $checks[] = self::check(
            str_contains($robots, 'Sitemap: '.$siteUrl.'/sitemap.xml')
                && str_contains($robots, $siteUrl.'/llms.txt'),
            true,
            'robots.txt points at the sitemap and /llms.txt.',
        );

        $missingPrivate = array_values(array_filter(
            AiCrawlerPolicy::PRIVATE_PREFIXES,
            fn (string $path): bool => ! str_contains($robots, 'Disallow: '.$path),
        ));

        $checks[] = self::check(
            $missingPrivate === [],
            true,
            $missingPrivate === []
                ? 'Private paths are disallowed in robots.txt.'
                : 'Missing Disallow for: '.implode(', ', $missingPrivate),
        );

        $checks[] = self::check(
            $briefBuilt
                && str_contains($brief, $siteUrl.'/consultation')
                && str_contains($brief, '## Hire')
                && str_contains($brief, '/services/devops'),
            true,
            $briefBuilt
                ? 'llms.txt tells answer engines how to hire and lists services.'
                : 'llms.txt could not be built.',
        );

        foreach (['GPTBot', 'ClaudeBot', 'PerplexityBot', 'bingbot', 'Google-Extended', 'Bytespider'] as $agent) {
            $checks[] = self::check(
                AiCrawlerPolicy::classify($agent) === 'search_ai',
                true,
                $agent.' is classified as a search or AI crawler.',
            );
        }

        $checks[] = self::check(
            AiCrawlerPolicy::classify('Mozilla/5.0 (compatible; AhrefsBot/7.0; +http://ahrefs.com/robot/)') === 'bulk',
            true,
            'AhrefsBot is classified as a bulk scraper.',
        );

        $checks[] = self::check(
            AiCrawlerPolicy::classify('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36') === 'browser',
            true,
            'A normal browser is not treated as a bulk scraper.',
        );

        $checks[] = self::check(
            (bool) config('ai.crawl_limit_enabled'),
            true,
            'Origin crawl budget is enabled.',
        );

        $key = (string) config('ai.indexnow_key');
        if ($key === '') {
            $checks[] = self::check(false, false, 'INDEXNOW_KEY is empty. Set it, deploy, then run php artisan seo:indexnow.');
        } else {
            $checks[] = self::check(
                (bool) preg_match('/^[a-f0-9]{8,128}$/', $key),
                true,
                'INDEXNOW_KEY is 8–128 hex characters.',
            );
        }

        $bing = (string) config('ai.bing_site_verification');
        $checks[] = self::check(
            $bing !== '' && (bool) preg_match('/^[A-Za-z0-9]+$/', $bing),
            false,
            $bing === ''
                ? 'BING_SITE_VERIFICATION is empty. Paste the msvalidate.01 value from Bing Webmaster Tools.'
                : 'Bing site verification meta value is set.',
        );

        return $checks;
    }

    /**
     * @return Check
     */
    private static function check(bool $ok, bool $required, string $message): array
    {
        return ['ok' => $ok, 'required' => $required, 'message' => $message];
    }
}
