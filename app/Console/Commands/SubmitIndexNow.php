<?php

namespace App\Console\Commands;

use App\Support\BlogRepository;
use App\Support\CaseStudyRepository;
use App\Support\IndexNow;
use App\Support\PublicSitemap;
use App\Support\SeoCatalog;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;

class SubmitIndexNow extends Command
{
    protected $signature = 'seo:indexnow
        {--site= : Public https origin. Defaults to APP_URL}
        {--changed : Only submit URLs whose title, description, or content date changed since the last run}';

    private const LEDGER = 'seo.indexnow.fingerprints';

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
        $fingerprints = $this->fingerprints();
        $urls = array_keys($fingerprints);

        if ($urls === []) {
            $this->error('Sitemap URL list is empty.');

            return self::FAILURE;
        }

        if ($this->option('changed')) {
            $previous = Cache::get(self::LEDGER, []);
            $urls = array_keys(array_diff_assoc($fingerprints, is_array($previous) ? $previous : []));

            if ($urls === []) {
                $this->info('No changed URLs to submit.');

                return self::SUCCESS;
            }
        }

        $response = IndexNow::submit($site, $urls);

        if ($response->status() === 200 || $response->status() === 202) {
            Cache::forever(self::LEDGER, $fingerprints);
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

    /**
     * One hash per sitemap URL from what search engines index: the title, the
     * description, and the content date. View counts and share links stay out.
     *
     * @return array<string, string>
     */
    private function fingerprints(): array
    {
        $blog = new BlogRepository;
        $studies = new CaseStudyRepository;
        $content = collect($blog->indexPosts())
            ->mapWithKeys(fn (array $post) => [$blog->absoluteUrl($post['slug']) => [
                $post['title'], $post['brief'], $post['lastModifiedAtIso'], $post['readTimeInMinutes'],
            ]])
            ->merge(collect($studies->indexStudies())->mapWithKeys(fn (array $study) => [$studies->absoluteUrl($study['slug']) => [
                $study['title'], $study['lastModifiedAtIso'],
            ]]));

        return collect(PublicSitemap::entries())
            ->mapWithKeys(fn (array $entry) => [$entry['loc'] => sha1((string) json_encode([
                $entry['lastmod'] ?? null,
                $content[$entry['loc']] ?? SeoCatalog::forPath((string) (parse_url($entry['loc'], PHP_URL_PATH) ?: '/'))?->toArray(),
            ]))])
            ->all();
    }
}
