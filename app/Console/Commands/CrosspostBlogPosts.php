<?php

namespace App\Console\Commands;

use App\Models\BlogCrosspost;
use App\Support\BlogRepository;
use Illuminate\Console\Command;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use League\HTMLToMarkdown\Converter\TableConverter;
use League\HTMLToMarkdown\Environment;
use League\HTMLToMarkdown\HtmlConverter;
use RuntimeException;

class CrosspostBlogPosts extends Command
{
    private const SITE = 'https://harun.dev';

    private const CDN = 'https://cdn.harun.dev';

    protected $signature = 'blog:crosspost
        {slug? : One post. Without it, every public post from the last --within-days is cross-posted}
        {--to=devto,hashnode : Comma-separated platforms}
        {--within-days=7 : Auto mode window, keeps the old backlog out}
        {--delay-days=3 : Auto mode waits this long after the post goes live on harun.dev so Google indexes the original first}
        {--gap-days=3 : Auto mode sends at most one post per platform in this many days}
        {--draft : Save as a draft (dev.to only; Hashnode drafts cannot carry a canonical URL)}
        {--force : Re-send a post that is already in the ledger (creates a second copy on dev.to)}
        {--dry-run : Print the Markdown instead of sending}';

    protected $description = 'Cross-post public blog posts to dev.to and Hashnode with a canonical URL back to harun.dev';

    public function handle(BlogRepository $blog): int
    {
        $platforms = array_filter(array_map('trim', explode(',', (string) $this->option('to'))));
        $failed = false;

        foreach ($this->posts($blog) as $post) {
            $markdown = null;

            foreach ($platforms as $platform) {
                if (! $this->option('force') && BlogCrosspost::where(['slug' => $post['slug'], 'platform' => $platform])->exists()) {
                    continue;
                }

                if (! $this->configured($platform) || (! $this->argument('slug') && $this->inGap($platform))) {
                    continue;
                }

                $markdown ??= $this->markdown($blog, $post);

                if ($this->option('dry-run')) {
                    $this->line("--- {$platform}: {$post['slug']}\n{$markdown}");

                    continue;
                }

                try {
                    $remote = $platform === 'devto' ? $this->devto($post, $markdown) : $this->hashnode($post, $markdown);
                } catch (RuntimeException $e) {
                    $failed = true;
                    $this->error("{$platform} {$post['slug']}: {$e->getMessage()}");

                    continue;
                }

                BlogCrosspost::updateOrCreate(['slug' => $post['slug'], 'platform' => $platform], $remote);
                $this->info("{$platform} {$post['slug']}: {$remote['remote_url']}");
            }
        }

        return $failed ? self::FAILURE : self::SUCCESS;
    }

    /** @return list<array<string, mixed>> */
    private function posts(BlogRepository $blog): array
    {
        $slug = $this->argument('slug');
        $oldest = now()->subDays((int) $this->option('within-days'));
        $newest = now()->subDays((int) $this->option('delay-days'));
        $posts = $slug ? array_filter([$blog->find($slug)]) : $blog->posts();

        // Canonical must resolve, so drafts and scheduled posts never go out.
        $posts = array_values(array_filter($posts, fn (array $post) => $blog->isPublic($post)
            && ($slug || $blog->effectivePublishedAt($post)->between($oldest, $newest))));

        // Oldest first, so the queue drains in publishing order.
        usort($posts, fn (array $a, array $b) => $blog->effectivePublishedAt($a)->timestamp <=> $blog->effectivePublishedAt($b)->timestamp);

        return $posts;
    }

    private function inGap(string $platform): bool
    {
        return BlogCrosspost::where('platform', $platform)
            ->where('created_at', '>', now()->subDays((int) $this->option('gap-days')))
            ->exists();
    }

    private function configured(string $platform): bool
    {
        $ready = match ($platform) {
            'devto' => config('services.devto.api_key'),
            'hashnode' => config('services.hashnode.token') && ! $this->option('draft'),
            default => false,
        };

        if (! $ready && $this->argument('slug')) {
            $this->warn("Skipping {$platform}: missing credentials, unknown platform, or --draft on Hashnode.");
        }

        return (bool) $ready;
    }

    private function canonical(array $post): string
    {
        return self::SITE.'/blog/'.$post['slug'];
    }

    private function markdown(BlogRepository $blog, array $post): string
    {
        $html = $blog->withContent($post)['content']['html'];
        $canonical = $this->canonical($post);

        // Platforms can't run our React figures: GIF (if captured) + link to the live one.
        $html = preg_replace_callback(
            '#<div data-blog-activity="([\w-]+)"(?: data-algorithm="([\w-]+)")?></div>#',
            function (array $m) use ($post, $canonical): string {
                $key = $m[1].(isset($m[2]) ? '-'.$m[2] : '');
                $gif = "/blog-assets/{$post['slug']}/activity-{$key}.gif";
                $img = is_file(public_path($gif)) ? "<p><a href=\"{$canonical}\"><img src=\"{$gif}\" alt=\"Interactive demo\"></a></p>" : '';

                return $img."<p><a href=\"{$canonical}\">▶ Try the interactive demo on harun.dev</a></p>";
            },
            $html,
        );

        $html = preg_replace('#((?:src|href)=")/(blog-assets|service-assets|case-studies-assets|images)/#', '$1'.self::CDN.'/$2/', $html);
        $html = preg_replace('#(href=")/(?!/)#', '$1'.self::SITE.'/', $html);

        $environment = Environment::createDefaultEnvironment(['strip_tags' => true, 'hard_break' => false, 'suppress_errors' => true]);
        $environment->addConverter(new TableConverter);
        $markdown = (new HtmlConverter($environment))->convert($html);

        return $markdown."\n\n---\n\nOriginally published at [harun.dev]({$canonical}). The full interactive version lives there. "
            .'Follow me on [X](https://x.com/harundotdev) or read my [bio](https://harun.dev/bio).';
    }

    /** @return array{remote_id: string, remote_url: string} */
    private function devto(array $post, string $markdown): array
    {
        $response = Http::withHeaders(['api-key' => config('services.devto.api_key')])
            ->post('https://dev.to/api/articles', ['article' => array_filter([
                'title' => $post['title'],
                'body_markdown' => $markdown,
                'published' => ! $this->option('draft'),
                'description' => $post['brief'] ?? null,
                'canonical_url' => $this->canonical($post),
                'main_image' => $this->cover($post),
                // dev.to tags are alphanumeric only, max 4.
                'tags' => array_slice(array_values(array_unique(array_map(
                    fn (array $t) => preg_replace('/[^a-z0-9]/', '', strtolower($t['slug'])),
                    $post['tags'] ?? [],
                ))), 0, 4),
            ], fn ($v) => $v !== null)]);

        $this->ensureOk($response);

        return ['remote_id' => (string) $response['id'], 'remote_url' => (string) $response['url']];
    }

    /** @return array{remote_id: string, remote_url: string} */
    private function hashnode(array $post, string $markdown): array
    {
        $input = array_filter([
            'title' => $post['title'],
            'subtitle' => $post['brief'] ?? null,
            'contentMarkdown' => $markdown,
            'publicationId' => $this->hashnodePublicationId(),
            'originalArticleURL' => $this->canonical($post),
            'tags' => array_map(fn (array $t) => ['slug' => $t['slug'], 'name' => $t['name']], array_slice($post['tags'] ?? [], 0, 5)),
            'coverImageOptions' => ($cover = $this->cover($post)) ? ['coverImageURL' => $cover] : null,
        ], fn ($v) => $v !== null);

        $response = Http::withHeaders(['Authorization' => config('services.hashnode.token')])
            ->post('https://gql.hashnode.com/', [
                'query' => 'mutation ($input: PublishPostInput!) { publishPost(input: $input) { post { id url } } }',
                'variables' => ['input' => $input],
            ]);

        $this->ensureOk($response);
        $created = $response->json('data.publishPost.post');

        return ['remote_id' => (string) $created['id'], 'remote_url' => (string) $created['url']];
    }

    // The token only identifies the user; publishPost needs to know which blog. One blog: look it up.
    private function hashnodePublicationId(): string
    {
        if ($id = config('services.hashnode.publication_id')) {
            return $id;
        }

        $response = Http::withHeaders(['Authorization' => config('services.hashnode.token')])
            ->post('https://gql.hashnode.com/', ['query' => '{ me { publications(first: 2) { edges { node { id } } } } }']);
        $this->ensureOk($response);
        $edges = $response->json('data.me.publications.edges', []);

        if (count($edges) !== 1) {
            throw new RuntimeException('Set HASHNODE_PUBLICATION_ID: the token has '.count($edges).' publications, expected exactly 1.');
        }

        return $edges[0]['node']['id'];
    }

    private function cover(array $post): ?string
    {
        $cover = $post['coverImageUrl'] ?? null;

        return is_string($cover) && $cover !== '' ? (str_starts_with($cover, '/') ? self::CDN.$cover : $cover) : null;
    }

    // Hashnode returns HTTP 200 with the failure in `errors`, so check both.
    private function ensureOk(Response $response): void
    {
        if ($response->failed() || $response->json('errors')) {
            throw new RuntimeException(mb_substr($response->body(), 0, 300));
        }
    }
}
