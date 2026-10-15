<?php

namespace App\Console\Commands;

use App\Models\BlogCrosspost;
use App\Support\BlogRepository;
use App\Support\IndexNow;
use Illuminate\Console\Command;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class PingBlogPost extends Command
{
    private const SITE = 'https://harun.dev';

    private const CDN = 'https://cdn.harun.dev';

    private const BSKY = 'https://bsky.social/xrpc/';

    protected $signature = 'blog:ping
        {slug? : One post. Without it, every public post from the last --within-hours that is not announced yet}
        {--within-hours=48 : Auto mode window, keeps the old backlog out}
        {--settle-minutes=30 : Auto mode waits this long after going live so the catalog cache and CDN serve the post}';

    protected $description = 'Announce a new post: IndexNow + WebSub ping, then Bluesky and Mastodon link posts';

    public function handle(BlogRepository $blog): int
    {
        foreach ($this->posts($blog) as $post) {
            foreach (['ping' => $this->ping(...), 'bluesky' => $this->bluesky(...), 'mastodon' => $this->mastodon(...)] as $channel => $send) {
                if (BlogCrosspost::where(['slug' => $post['slug'], 'platform' => $channel])->exists()) {
                    continue;
                }

                try {
                    $remote = $send($post);
                } catch (RuntimeException $e) {
                    // Logged, not failed: a bad token or outage must not trip the scheduler heartbeat. Retries next hour.
                    $this->warn("{$channel} {$post['slug']}: {$e->getMessage()}");

                    continue;
                }

                if ($remote) {
                    BlogCrosspost::create(['slug' => $post['slug'], 'platform' => $channel] + $remote);
                    $this->info("{$channel} {$post['slug']}: {$remote['remote_id']}");
                }
            }
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
            && ($slug || $blog->effectivePublishedAt($post)->between($oldest, $newest))));
    }

    private function url(array $post): string
    {
        return self::SITE.'/blog/'.$post['slug'];
    }

    /** @return array{remote_id: string, remote_url: string}|null */
    private function ping(array $post): ?array
    {
        $feed = self::SITE.'/blog/feed.xml';
        $sent = [];

        if (IndexNow::configured()
            && in_array(IndexNow::submit(self::SITE, [$this->url($post), self::SITE.'/blog', $feed, self::SITE.'/sitemap.xml'])->status(), [200, 202], true)) {
            $sent[] = 'indexnow';
        }

        if (Http::asForm()->post('https://pubsubhubbub.appspot.com/', ['hub.mode' => 'publish', 'hub.url' => $feed])->successful()) {
            $sent[] = 'websub';
        }

        // Nothing got through: no ledger row, so the next hour retries.
        return $sent ? ['remote_id' => implode(',', $sent), 'remote_url' => $this->url($post)] : null;
    }

    /** @return array{remote_id: string, remote_url: string}|null */
    private function bluesky(array $post): ?array
    {
        $handle = config('services.bluesky.handle');

        if (! $handle || ! config('services.bluesky.password')) {
            return null;
        }

        $session = Http::post(self::BSKY.'com.atproto.server.createSession', ['identifier' => $handle, 'password' => config('services.bluesky.password')]);
        $this->ensureOk($session);
        $auth = ['Authorization' => 'Bearer '.$session['accessJwt']];

        $card = ['uri' => $this->url($post), 'title' => $post['title'], 'description' => mb_strimwidth((string) ($post['brief'] ?? ''), 0, 200, '…')];

        // The card is the link; a missing or oversized thumbnail should not block the post.
        if (($cover = $this->cover($post)) && ($image = Http::timeout(20)->get($cover))->successful() && strlen($image->body()) < 950000) {
            $upload = Http::withHeaders($auth)->withBody($image->body(), $image->header('Content-Type') ?: 'image/jpeg')->post(self::BSKY.'com.atproto.repo.uploadBlob');
            $card['thumb'] = $upload->json('blob');
        }

        $response = Http::withHeaders($auth)->post(self::BSKY.'com.atproto.repo.createRecord', [
            'repo' => $session['did'],
            'collection' => 'app.bsky.feed.post',
            'record' => array_filter([
                '$type' => 'app.bsky.feed.post',
                'text' => mb_strimwidth($post['title'], 0, 290, '…'),
                'createdAt' => now()->toIso8601ZuluString(),
                'embed' => ['$type' => 'app.bsky.embed.external', 'external' => array_filter($card)],
            ]),
        ]);
        $this->ensureOk($response);

        return ['remote_id' => (string) $response['uri'], 'remote_url' => "https://bsky.app/profile/{$handle}/post/".basename($response['uri'])];
    }

    /** @return array{remote_id: string, remote_url: string}|null */
    private function mastodon(array $post): ?array
    {
        $instance = rtrim((string) config('services.mastodon.instance'), '/');

        if (! $instance || ! config('services.mastodon.token')) {
            return null;
        }

        // Mastodon only discovers posts through hashtags; counts a URL as 23 chars of the 500 limit.
        $tags = collect($post['tags'] ?? [])->map(fn (array $t) => '#'.preg_replace('/[^A-Za-z0-9]/', '', $t['name']))->filter(fn ($t) => strlen($t) > 1)->take(3)->implode(' ');
        $text = $post['title']."\n\n".mb_strimwidth((string) ($post['brief'] ?? ''), 0, 280, '…')."\n\n".$this->url($post).($tags ? "\n\n{$tags}" : '');

        $response = Http::withToken(config('services.mastodon.token'))
            ->withHeaders(['Idempotency-Key' => 'harun-dev-'.$post['slug']])
            ->post("{$instance}/api/v1/statuses", ['status' => $text, 'visibility' => 'public', 'language' => 'en']);
        $this->ensureOk($response);

        return ['remote_id' => (string) $response['id'], 'remote_url' => (string) $response['url']];
    }

    private function cover(array $post): ?string
    {
        $cover = $post['coverImageUrl'] ?? null;

        return is_string($cover) && $cover !== '' ? (str_starts_with($cover, '/') ? self::CDN.$cover : $cover) : null;
    }

    private function ensureOk(Response $response): void
    {
        if ($response->failed()) {
            throw new RuntimeException(mb_substr($response->body(), 0, 300));
        }
    }
}
