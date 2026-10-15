<?php

namespace App\Console\Commands;

use App\Models\BlogCrosspost;
use App\Support\BlogRepository;
use App\Support\IndexNow;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;

class PingBlogPost extends Command
{
    private const SITE = 'https://harun.dev';

    protected $signature = 'blog:ping
        {slug? : One post. Without it, every public post from the last --within-hours that was not pinged yet}
        {--within-hours=48 : Auto mode window, keeps the old backlog out}
        {--settle-minutes=30 : Auto mode waits this long after going live so the catalog cache and CDN serve the post}';

    protected $description = 'Tell IndexNow (Bing, Yandex) and the WebSub hub (feed readers) that a new post is live';

    public function handle(BlogRepository $blog): int
    {
        $feed = self::SITE.'/blog/feed.xml';

        foreach ($this->posts($blog) as $post) {
            $url = self::SITE.'/blog/'.$post['slug'];
            $sent = [];

            if (IndexNow::configured()
                && in_array(IndexNow::submit(self::SITE, [$url, self::SITE.'/blog', $feed, self::SITE.'/sitemap.xml'])->status(), [200, 202], true)) {
                $sent[] = 'indexnow';
            }

            if (Http::asForm()->post('https://pubsubhubbub.appspot.com/', ['hub.mode' => 'publish', 'hub.url' => $feed])->successful()) {
                $sent[] = 'websub';
            }

            // Nothing got through (outage, missing key): leave it out of the ledger so the next hour retries.
            if ($sent === []) {
                $this->warn("{$post['slug']}: no ping accepted, will retry");

                continue;
            }

            BlogCrosspost::updateOrCreate(['slug' => $post['slug'], 'platform' => 'ping'], ['remote_id' => implode(',', $sent), 'remote_url' => $url]);
            $this->info("{$post['slug']}: ".implode(', ', $sent));
        }

        return self::SUCCESS;
    }

    /** @return list<array<string, mixed>> */
    private function posts(BlogRepository $blog): array
    {
        $slug = $this->argument('slug');
        $oldest = now()->subHours((int) $this->option('within-hours'));
        $newest = now()->subMinutes((int) $this->option('settle-minutes'));
        $posts = $slug ? array_filter([$blog->find($slug)]) : $blog->posts();

        return array_values(array_filter($posts, fn (array $post) => $blog->isPublic($post)
            && ($slug || $blog->effectivePublishedAt($post)->between($oldest, $newest))
            && ! BlogCrosspost::where(['slug' => $post['slug'], 'platform' => 'ping'])->exists()));
    }
}
