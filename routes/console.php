<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

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

    $this->info('Bing retired /ping?sitemap= (HTTP 410). Submit the sitemap in Bing Webmaster Tools:');
    $this->line('- https://www.bing.com/webmasters/sitemaps');
    $this->line("- robots.txt already lists {$sitemapUrl}");
})->purpose('Remind GSC and Bing Webmaster sitemap resubmit steps');
