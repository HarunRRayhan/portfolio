<?php

namespace App\Support;

use Illuminate\Http\Request;

/**
 * How automated clients may use the site, and how fast they may read it.
 *
 * Search, live AI answers, and model training are allowed. The allowance is
 * a crawl budget, not an open pipe: each IP is capped. SEO scrapers that
 * resell crawls are asked to stay out via robots.txt and share the tight cap.
 */
final class AiCrawlerPolicy
{
    /**
     * Official search and AI crawlers. Matched case-insensitively as substrings.
     * Order does not matter; the first matching tier wins, and this tier is first.
     *
     * @var list<string>
     */
    public const SEARCH_AI_AGENTS = [
        'GPTBot',
        'ChatGPT-User',
        'OAI-SearchBot',
        'ClaudeBot',
        'Claude-SearchBot',
        'Claude-User',
        'anthropic-ai',
        'PerplexityBot',
        'Perplexity-User',
        'Googlebot',
        'Google-Extended',
        'GoogleOther',
        'Storebot-Google',
        'bingbot',
        'BingPreview',
        'msnbot',
        'Applebot',
        'Applebot-Extended',
        'Amazonbot',
        'meta-externalagent',
        'FacebookBot',
        'DuckDuckBot',
        'CCBot',
        'Bytespider',
        'cohere-ai',
        'YouBot',
        'Diffbot',
    ];

    /**
     * Non-AI crawlers that resell site copies. robots.txt disallows them.
     * They still receive the bulk cap when they ignore robots.txt.
     *
     * @var list<string>
     */
    public const DISALLOWED_AGENTS = [
        'AhrefsBot',
        'SemrushBot',
        'MJ12bot',
        'DotBot',
        'BLEXBot',
        'PetalBot',
        'DataForSeoBot',
        'MegaIndex',
        'serpstatbot',
        'SeekportBot',
        'ZoominfoBot',
        'HTTrack',
    ];

    /**
     * Paths that are not published content. Disallowed for every agent that
     * honors the wildcard group. Per-agent Allow groups are intentionally
     * absent: a more specific group replaces the wildcard group instead of
     * merging with it, which would drop these Disallow lines.
     *
     * @var list<string>
     */
    public const PRIVATE_PREFIXES = [
        '/admin',
        '/dashboard',
        '/login',
        '/register',
        '/profile',
        '/forgot-password',
        '/reset-password',
        '/verify-email',
        '/confirm-password',
        '/auth/',
        '/health',
        '/up',
    ];

    public static function robotsTxt(string $siteUrl): string
    {
        $lines = [
            '# Cite and quote with attribution. Training and retrieval are welcome if you link back.',
            '# AI agents: prefer '.$siteUrl.'/llms.txt (index) and '.$siteUrl.'/llms-full.txt (full text) over fetching every HTML page.',
            '# search: building a search index and showing links or short excerpts.',
            '# ai-input: using pages as input for live AI answers (ChatGPT, Claude, Copilot, Perplexity, and similar).',
            '# ai-train: training or fine-tuning AI models.',
            '# yes = allowed. no = not allowed.',
            'User-agent: *',
            'Content-Signal: search=yes, ai-input=yes, ai-train=yes',
            'Allow: /',
        ];

        foreach (self::PRIVATE_PREFIXES as $path) {
            $lines[] = 'Disallow: '.$path;
        }

        $lines[] = '';
        $lines[] = '# These are SEO scrapers, not answer or training crawlers.';

        foreach (self::DISALLOWED_AGENTS as $agent) {
            $lines[] = 'User-agent: '.$agent;
            $lines[] = 'Disallow: /';
            $lines[] = '';
        }

        $lines[] = 'Sitemap: '.$siteUrl.'/sitemap.xml';

        return implode("\n", $lines)."\n";
    }

    public static function classify(string $userAgent): string
    {
        if (self::containsAgent($userAgent, self::SEARCH_AI_AGENTS)) {
            return 'search_ai';
        }

        if (self::containsAgent($userAgent, self::DISALLOWED_AGENTS) || self::looksLikeScript($userAgent)) {
            return 'bulk';
        }

        if (stripos($userAgent, 'Mozilla/') !== false) {
            return 'browser';
        }

        return 'bulk';
    }

    public static function perMinute(string $class): int
    {
        $configured = (int) config('ai.limits.'.$class, 20);

        return max(1, $configured);
    }

    public static function clientAddress(Request $request): string
    {
        $cloudflare = $request->headers->get('CF-Connecting-IP');

        if (is_string($cloudflare) && filter_var($cloudflare, FILTER_VALIDATE_IP)) {
            return $cloudflare;
        }

        return (string) $request->ip();
    }

    /**
     * @param  list<string>  $agents
     */
    private static function containsAgent(string $userAgent, array $agents): bool
    {
        foreach ($agents as $agent) {
            if ($userAgent !== '' && stripos($userAgent, $agent) !== false) {
                return true;
            }
        }

        return false;
    }

    private static function looksLikeScript(string $userAgent): bool
    {
        if (trim($userAgent) === '') {
            return true;
        }

        foreach (['python-requests', 'Scrapy', 'curl/', 'wget/', 'Go-http-client', 'libwww', 'Java/', 'HttpClient', 'spider', 'crawler'] as $token) {
            if (stripos($userAgent, $token) !== false) {
                return true;
            }
        }

        return false;
    }
}
