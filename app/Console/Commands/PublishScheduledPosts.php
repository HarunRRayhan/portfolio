<?php

namespace App\Console\Commands;

use App\Models\BlogPostSchedule;
use App\Support\BlogRepository;
use App\Support\IndexNow;
use App\Support\LlmSiteIndex;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

class PublishScheduledPosts extends Command
{
    private const FEED_HUB = 'https://pubsubhubbub.appspot.com/';

    protected $signature = 'blog:publish-scheduled {--dry-run : Show what would be published without making changes}';

    protected $description = 'Publish blog posts whose schedule has passed, then notify IndexNow';

    public function handle(): int
    {
        $postsDir = resource_path('blog/posts');
        $files = glob($postsDir.'/*.md') ?: [];
        $now = Carbon::now();
        $published = [];
        /** @var array<string, Carbon> $due */
        $due = [];

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

            if (! preg_match('/^draft:\s*true\b/m', $meta)) {
                continue;
            }

            if (! preg_match('/^publishedAt:\s*"(.+?)"/m', $meta, $dateMatch)) {
                continue;
            }

            if (preg_match('/^slug:\s*"(.+?)"/m', $meta, $slugMatch) !== 1) {
                continue;
            }

            $slug = $slugMatch[1];
            $fileAt = Carbon::parse($dateMatch[1]);
            $schedule = BlogPostSchedule::query()->where('slug', $slug)->first();
            $effective = $schedule?->publish_at?->copy() ?? $fileAt->copy();

            if ($effective->greaterThan($now)) {
                if ($this->option('dry-run')) {
                    $this->line(sprintf('  Skipped [future]: %s (scheduled %s)', basename($file), $effective->toIso8601String()));
                }

                continue;
            }

            if ($fileAt->lessThanOrEqualTo($now)) {
                $meta = preg_replace('/^draft:\s*true\s*\n/m', '', $meta) ?? $meta;
                $meta = preg_replace('/^draftToken:\s*".*?"\s*\n/m', '', $meta) ?? $meta;
                $newContents = "---\n{$meta}\n---\n{$body}";

                if ($this->option('dry-run')) {
                    $this->line(sprintf('  Would publish: %s', basename($file)));
                } else {
                    file_put_contents($file, $newContents);
                    $this->line(sprintf('  Published: %s', basename($file)));
                }

                $published[] = basename($file);
            } else {
                $this->line(sprintf('  Due by schedule: %s', $slug));
            }

            if ($schedule?->notified_at === null) {
                $due[$slug] = $effective;
            }
        }

        if ($published !== [] || $due !== []) {
            try {
                Cache::forget(BlogRepository::cacheKey());
                LlmSiteIndex::forget();
                $this->info($published !== []
                    ? sprintf('Published %d post(s). Blog cache cleared.', count($published))
                    : sprintf('Blog cache cleared for %d scheduled post(s).', count($due)));
            } catch (\Throwable $e) {
                $this->warn('Could not clear the blog cache: '.$e->getMessage());
            }
        } else {
            $this->info('No scheduled posts to publish.');
        }

        if (! $this->option('dry-run') && $due !== []) {
            if ($this->notifyIndexNow(array_keys($due))) {
                $this->markNotified($due);
            }

            $this->pingFeedHub();
            $this->line('Google retired /ping?sitemap=. The new URL is already in /sitemap.xml for the next Search Console crawl.');
        }

        return Command::SUCCESS;
    }

    /**
     * @param  array<string, Carbon>  $due
     */
    private function markNotified(array $due): void
    {
        foreach ($due as $slug => $publishAt) {
            $row = BlogPostSchedule::query()->firstOrNew(['slug' => $slug]);

            if (! $row->exists) {
                $row->publish_at = $publishAt;
            }

            $row->notified_at = now();
            $row->save();
        }
    }

    /**
     * @param  list<string>  $slugs
     */
    private function notifyIndexNow(array $slugs): bool
    {
        $site = rtrim((string) config('app.url'), '/');

        if ($slugs === [] || ! IndexNow::acceptsSite($site) || ! IndexNow::configured()) {
            return true;
        }

        $blog = new BlogRepository;
        $urls = array_map(fn (string $slug): string => $blog->absoluteUrl($slug), $slugs);

        try {
            $response = IndexNow::submit($site, $urls);
        } catch (\Throwable $exception) {
            $this->warn('IndexNow notification failed: '.$exception->getMessage());

            return false;
        }

        if (in_array($response->status(), [200, 202], true)) {
            $this->info('Notified IndexNow about '.count($urls).' new post URL(s).');

            return true;
        }

        $this->warn('IndexNow returned HTTP '.$response->status().'.');

        return false;
    }

    private function pingFeedHub(): void
    {
        if (! app()->environment('production')) {
            return;
        }

        $feed = rtrim((string) config('app.url'), '/').'/blog/feed.xml';

        try {
            Http::asForm()->timeout(15)->post(self::FEED_HUB, [
                'hub.mode' => 'publish',
                'hub.url' => $feed,
            ]);
            $this->info('Pinged the feed hub about '.$feed.'.');
        } catch (\Throwable $exception) {
            $this->warn('Feed hub ping failed: '.$exception->getMessage());
        }
    }
}
