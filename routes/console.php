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

    $sitemapUrl = $this->option('url') ?: $defaultSiteUrl.'/sitemap.xml';

    $this->info('Google retired /ping?sitemap=. Resubmit the sitemap in Search Console:');
    $this->line("- {$sitemapUrl}");
    $this->line('- Property: sc-domain:harun.dev');
    $this->line('- Then URL-inspect https://harun.dev/services/devops and one blog post.');

    try {
        $response = Http::timeout(20)->get('https://www.bing.com/ping?sitemap='.urlencode($sitemapUrl));
        $ok = $response->successful() ? 'ok' : 'not-ok';
        $this->line("- Bing ping: {$ok} (HTTP {$response->status()})");
    } catch (Throwable $e) {
        $this->error("- Bing ping: failed ({$e->getMessage()})");
    }
})->purpose('Remind GSC sitemap resubmit and ping Bing');
