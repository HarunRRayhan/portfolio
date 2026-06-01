<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Http;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote')->hourly();

Artisan::command('seo:ping-sitemap {--url= : Sitemap URL to ping}', function () {
    $defaultSiteUrl = rtrim(config('app.url', url('/')), '/');
    if (preg_match('#^https?://(localhost|127\.0\.0\.1)(?::\d+)?$#', $defaultSiteUrl)) {
        $defaultSiteUrl = 'https://harun.dev';
    }

    $sitemapUrl = $this->option('url') ?: $defaultSiteUrl . '/sitemap.xml';
    $endpoints = [
        'Google' => 'https://www.google.com/ping?sitemap=' . urlencode($sitemapUrl),
        'Bing' => 'https://www.bing.com/ping?sitemap=' . urlencode($sitemapUrl),
    ];

    $this->info("Pinging search engines with sitemap: {$sitemapUrl}");

    foreach ($endpoints as $name => $endpoint) {
        try {
            $response = Http::timeout(20)->get($endpoint);
            $status = $response->status();
            $ok = $response->successful() ? 'ok' : 'not-ok';
            $this->line("- {$name}: {$ok} (HTTP {$status})");
        } catch (\Throwable $e) {
            $this->error("- {$name}: failed ({$e->getMessage()})");
        }
    }

    $this->line('Sitemap URLs to submit in Google Search Console:');
    $this->line("- {$sitemapUrl}");
    $this->line('- ' . preg_replace('#/sitemap\.xml$#', '/robots.txt', $sitemapUrl));
})->purpose('Ping search engines with the current sitemap URL');
