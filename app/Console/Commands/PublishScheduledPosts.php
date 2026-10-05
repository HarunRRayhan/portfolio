<?php

namespace App\Console\Commands;

use App\Support\BlogRepository;
use App\Support\IndexNow;
use App\Support\LlmSiteIndex;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;

class PublishScheduledPosts extends Command
{
    protected $signature = 'blog:publish-scheduled {--dry-run : Show what would be published without making changes}';

    protected $description = 'Publish blog posts with draft:true whose publishedAt has passed';

    public function handle(): int
    {
        $postsDir = resource_path('blog/posts');
        $files = glob($postsDir.'/*.md');
        $now = Carbon::now();
        $published = [];
        $publishedSlugs = [];

        foreach ($files as $file) {
            $contents = file_get_contents($file);
            if ($contents === false) {
                continue;
            }

            if (! preg_match('/^---\R(.*?)\R---\R(.*)\z/s', $contents, $matches)) {
                continue;
            }

            $meta = $matches[1];
            $body = $matches[2];

            // Skip if not a draft
            if (! preg_match('/^draft:\s*true\b/m', $meta)) {
                continue;
            }

            // Extract publishedAt
            if (! preg_match('/^publishedAt:\s*"(.+?)"/m', $meta, $dateMatch)) {
                continue;
            }

            $publishedAt = Carbon::parse($dateMatch[1]);

            if ($publishedAt->greaterThan($now)) {
                $this->line(sprintf('  Skipped [future]: %s (scheduled %s)', basename($file), $publishedAt->toIso8601String()));

                continue;
            }

            // Remove draft and draftToken lines from frontmatter
            $meta = preg_replace('/^draft:\s*true\s*\n/m', '', $meta);
            $meta = preg_replace('/^draftToken:\s*".*?"\s*\n/m', '', $meta);

            $newContents = "---\n{$meta}\n---\n{$body}";

            if ($this->option('dry-run')) {
                $this->line(sprintf('  Would publish: %s', basename($file)));
            } else {
                file_put_contents($file, $newContents);
                $this->line(sprintf('  Published: %s', basename($file)));
            }

            $published[] = basename($file);

            if (preg_match('/^slug:\s*"(.+?)"/m', $meta, $slugMatch) === 1) {
                $publishedSlugs[] = $slugMatch[1];
            }
        }

        if ($published) {
            try {
                Cache::forget(BlogRepository::cacheKey());
                LlmSiteIndex::forget();
                $this->info(sprintf('Published %d post(s). Blog cache cleared.', count($published)));
            } catch (\Throwable $e) {
                $this->warn(sprintf('Published %d post(s). Could not clear cache: %s', count($published), $e->getMessage()));
            }

            if (! $this->option('dry-run')) {
                $this->notifyIndexNow($publishedSlugs);
            }
        } else {
            $this->info('No scheduled posts to publish.');
        }

        return Command::SUCCESS;
    }

    /**
     * @param  list<string>  $slugs
     */
    private function notifyIndexNow(array $slugs): void
    {
        $site = rtrim((string) config('app.url'), '/');

        if ($slugs === [] || ! IndexNow::acceptsSite($site) || ! IndexNow::configured()) {
            return;
        }

        $blog = new BlogRepository;
        $urls = array_map(fn (string $slug): string => $blog->absoluteUrl($slug), $slugs);

        try {
            $response = IndexNow::submit($site, $urls);
        } catch (\Throwable $exception) {
            $this->warn('IndexNow notification failed: '.$exception->getMessage());

            return;
        }

        if (in_array($response->status(), [200, 202], true)) {
            $this->info('Notified IndexNow about '.count($urls).' new post URL(s).');

            return;
        }

        $this->warn('IndexNow returned HTTP '.$response->status().'.');
    }
}
