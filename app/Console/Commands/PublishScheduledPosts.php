<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Carbon;

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

            $newContents = "---\n{$meta}---\n{$body}";

            if ($this->option('dry-run')) {
                $this->line(sprintf('  Would publish: %s', basename($file)));
            } else {
                file_put_contents($file, $newContents);
                $this->line(sprintf('  Published: %s', basename($file)));
            }

            $published[] = basename($file);
        }

        if ($published) {
            try {
                Cache::forget('blog.repository.payload');
                $this->info(sprintf('Published %d post(s). Blog cache cleared.', count($published)));
            } catch (\Throwable $e) {
                $this->warn(sprintf('Published %d post(s). Could not clear cache: %s', count($published), $e->getMessage()));
            }
        } else {
            $this->info('No scheduled posts to publish.');
        }

        return Command::SUCCESS;
    }
}
