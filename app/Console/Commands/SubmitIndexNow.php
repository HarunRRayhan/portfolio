<?php

namespace App\Console\Commands;

use App\Support\IndexNow;
use App\Support\PublicSitemap;
use Illuminate\Console\Command;

class SubmitIndexNow extends Command
{
    protected $signature = 'seo:indexnow {--site= : Public https origin. Defaults to APP_URL}';

    protected $description = 'Submit sitemap URLs to IndexNow so Bing can pick up new and updated pages';

    public function handle(): int
    {
        $site = rtrim((string) ($this->option('site') ?: config('app.url')), '/');

        if (! IndexNow::acceptsSite($site)) {
            $this->error('Refusing to submit. Pass a public https origin, for example --site=https://harun.dev');

            return self::FAILURE;
        }

        if (! IndexNow::configured()) {
            $this->error('INDEXNOW_KEY must be 8–128 hex characters. Generate one with: php -r "echo bin2hex(random_bytes(16)), PHP_EOL;"');

            return self::FAILURE;
        }

        config(['app.url' => $site]);

        $host = (string) parse_url($site, PHP_URL_HOST);
        $urls = PublicSitemap::locations();

        if ($urls === []) {
            $this->error('Sitemap URL list is empty.');

            return self::FAILURE;
        }

        $response = IndexNow::submit($site, $urls);

        if ($response->status() === 200 || $response->status() === 202) {
            $this->info('Submitted '.count($urls).' URL(s) to IndexNow for '.$host.'.');

            return self::SUCCESS;
        }

        $this->error('IndexNow returned HTTP '.$response->status().'.');
        $body = trim($response->body());
        if ($body !== '') {
            $this->line($body);
        }

        return self::FAILURE;
    }
}
