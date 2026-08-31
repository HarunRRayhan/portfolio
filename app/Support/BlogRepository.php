<?php

namespace App\Support;

use App\Models\ShortLink;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use RuntimeException;
use Symfony\Component\Yaml\Yaml;

class BlogRepository
{
    private const CONTENT_DIR = 'blog/posts';

    private const PUBLICATION_PATH = 'blog/publication.yml';

    private const CACHE_KEY = 'blog.repository.payload';

    private const CACHE_TTL_MINUTES = 15;

    /**
     * The cache store (`database`, a shared Postgres DB per §2.1 of the
     * tailscale-dev design doc) is shared by every worktree checkout running
     * as the same OS user. Scoping the key by base_path() keeps each
     * checkout's dev server reading/writing its own cached post list instead
     * of clobbering another worktree's, which otherwise produces phantom
     * 404s for posts that only exist in one worktree's resources/blog/posts/.
     */
    public static function cacheKey(): string
    {
        return self::CACHE_KEY.'.'.md5(base_path());
    }

    /**
     * @var array<string, mixed>|null
     */
    private ?array $data = null;

    /**
     * @return array<string, mixed>
     */
    public function publication(): array
    {
        return $this->load()['publication'];
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function posts(): array
    {
        return $this->load()['posts'];
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function indexPosts(): array
    {
        $posts = collect($this->posts())
            ->reject(fn (array $post) => (bool) ($post['draft'] ?? false))
            ->values();

        $viewCounts = $this->viewCountsBySlug(
            $posts->pluck('slug')->filter()->values()->all()
        );

        return $posts
            ->map(fn (array $post) => $this->summarizePost($post, $viewCounts[$post['slug']] ?? 0))
            ->all();
    }

    /**
     * @return array<string, mixed>|null
     */
    public function find(string $slug): ?array
    {
        return collect($this->posts())
            ->first(fn (array $post) => $post['slug'] === $slug);
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function related(string $slug, int $limit = 3): array
    {
        return collect($this->posts())
            ->reject(fn (array $post) => $post['slug'] === $slug)
            ->reject(fn (array $post) => (bool) ($post['draft'] ?? false))
            ->sortByDesc('publishedAt')
            ->take($limit)
            ->map(fn (array $post) => $this->summarizePost($post))
            ->values()
            ->all();
    }

    public function previewUrl(string $slug): ?string
    {
        $post = $this->find($slug);

        if (! $post || ! (bool) ($post['draft'] ?? false)) {
            return null;
        }

        $token = $post['draftToken'] ?? null;

        if (! is_string($token) || $token === '') {
            return null;
        }

        return $this->absoluteUrl($slug).'/draft/'.$token;
    }

    /**
     * @return array<string, mixed>
     */
    public function summarizePost(array $post, ?int $viewCount = null): array
    {
        return [
            'title' => $post['title'],
            'slug' => $post['slug'],
            'brief' => $post['brief'],
            'publishedAt' => $post['publishedAt'],
            'publishedAtHuman' => Carbon::parse($post['publishedAt'])->format('M j, Y'),
            'publishedAtIso' => Carbon::parse($post['publishedAt'])->toAtomString(),
            'readTimeInMinutes' => $post['readTimeInMinutes'],
            'readTimeLabel' => $post['readTimeInMinutes'].' min read',
            'reactionCount' => $post['reactionCount'],
            'responseCount' => $post['responseCount'],
            'replyCount' => $post['replyCount'],
            'coverImageUrl' => $this->resolveCoverImageUrl($post['coverImageUrl'] ?? null),
            'coverImageAlt' => $post['coverImageAlt'] ?? $post['title'],
            'viewCount' => $viewCount ?? Cache::remember("post.views.{$post['slug']}", 3600, function () use ($post) {
                try {
                    $row = DB::table('blog_post_views')
                        ->where('slug', $post['slug'])
                        ->first(['count']);

                    return $row ? (int) $row->count : 0;
                } catch (\Throwable) {
                    return 0;
                }
            }),
            'isDraft' => (bool) ($post['draft'] ?? false),
            'draftPreviewUrl' => $this->previewUrl($post['slug']),
            'tags' => collect($post['tags'] ?? [])
                ->map(fn (array $tag) => [
                    'name' => $tag['name'],
                    'slug' => $tag['slug'],
                ])
                ->values()
                ->all(),
            'url' => $this->relativeUrl($post['slug']),
            'canonicalUrl' => $this->absoluteUrl($post['slug']),
            'shareUrl' => $this->shareUrl($post),
            'sourceUrl' => $post['sourceUrl'] ?? $this->sourceUrl($post['slug']),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function toPostPagePayload(array $post): array
    {
        $summary = $this->summarizePost($post);

        return array_merge($summary, [
            'contentHtml' => $post['content']['html'] ?? '',
        ]);
    }

    public function relativeUrl(string $slug): string
    {
        return '/blog/'.$slug;
    }

    public function absoluteUrl(string $slug): string
    {
        return rtrim(config('app.url', url('/')), '/').$this->relativeUrl($slug);
    }

    /**
     * @param  array<string, mixed>  $post
     */
    public function shareUrl(array $post): string
    {
        $absoluteUrl = $this->absoluteUrl($post['slug']);

        return Cache::remember(
            "post.shareurl.{$post['slug']}",
            3600,
            fn () => ShortLink::getOrCreateForUrl($absoluteUrl, $post['title'])?->short_url ?? $absoluteUrl,
        );
    }

    public function sourceUrl(string $slug): string
    {
        $sourceUrl = rtrim($this->publication()['url'], '/').'/'.$slug;

        return 'https://web.archive.org/web/*/'.$sourceUrl;
    }

    /**
     * @return array<string, mixed>
     */
    private function load(): array
    {
        if ($this->data !== null) {
            return $this->data;
        }

        $this->data = Cache::remember(self::cacheKey(), now()->addMinutes(self::CACHE_TTL_MINUTES), function (): array {
            $publication = $this->loadPublication();
            $posts = collect(glob(resource_path(self::CONTENT_DIR.'/*.md')) ?: [])
                ->map(fn (string $path) => $this->parsePostFile($path, $publication))
                ->sortByDesc(fn (array $post) => Carbon::parse($post['publishedAt'])->timestamp)
                ->values()
                ->all();

            return [
                'publication' => $publication,
                'posts' => $posts,
            ];
        });

        return $this->data;
    }



    /**
     * @return array<string, mixed>
     */
    private function loadPublication(): array
    {
        $path = resource_path(self::PUBLICATION_PATH);

        if (! file_exists($path)) {
            throw new RuntimeException("Blog publication metadata missing: {$path}");
        }

        $publication = Yaml::parseFile($path);

        if (! is_array($publication) || ! isset($publication['title'], $publication['url'], $publication['host'])) {
            throw new RuntimeException('Blog publication metadata has unexpected shape.');
        }

        return $publication;
    }

    /**
     * @return array<string, mixed>
     */
    private function parsePostFile(string $path, array $publication): array
    {
        $contents = file_get_contents($path);

        if ($contents === false) {
            throw new RuntimeException("Unable to read blog post file: {$path}");
        }

        if (! preg_match('/^---\R(.*?)\R---\R(.*)\z/s', $contents, $matches)) {
            throw new RuntimeException("Blog post file has invalid frontmatter: {$path}");
        }

        $meta = Yaml::parse($matches[1]);

        if (! is_array($meta) || ! isset($meta['title'], $meta['slug'], $meta['brief'], $meta['publishedAt'], $meta['readTimeInMinutes'])) {
            throw new RuntimeException("Blog post file has unexpected metadata: {$path}");
        }

        $body = trim($matches[2]);

        if ($body === '') {
            throw new RuntimeException("Blog post file has empty content body: {$path}");
        }

        $slug = (string) $meta['slug'];

        return array_merge($meta, [
            'publishedAt' => (string) $meta['publishedAt'],
            'readTimeInMinutes' => (int) $meta['readTimeInMinutes'],
            'reactionCount' => (int) ($meta['reactionCount'] ?? 0),
            'responseCount' => (int) ($meta['responseCount'] ?? 0),
            'replyCount' => (int) ($meta['replyCount'] ?? 0),
            'draft' => filter_var($meta['draft'] ?? false, FILTER_VALIDATE_BOOLEAN),
            'draftToken' => isset($meta['draftToken']) ? (string) $meta['draftToken'] : '',
            'coverImageUrl' => $meta['coverImageUrl'] ?? null,
            'tags' => collect($meta['tags'] ?? [])
                ->map(function ($tag): array {
                    if (! is_array($tag) || ! isset($tag['name'], $tag['slug'])) {
                        throw new RuntimeException('Blog post tag metadata has unexpected shape.');
                    }

                    return [
                        'name' => (string) $tag['name'],
                        'slug' => (string) $tag['slug'],
                    ];
                })
                ->values()
                ->all(),
            'sourceUrl' => (string) ($meta['sourceUrl'] ?? $this->sourceUrlFromPublication($publication, $slug)),
            'content' => [
                'html' => $body,
                'text' => $this->contentText($body),
            ],
        ]);
    }

    /**
     * @return string
     */
    private function sourceUrlFromPublication(array $publication, string $slug): string
    {
        $sourceUrl = rtrim((string) $publication['url'], '/').'/'.$slug;

        return 'https://web.archive.org/web/*/'.$sourceUrl;
    }

    /**
     * Locally-hosted covers are stored in frontmatter as root-relative paths
     * (e.g. /blog-assets/{slug}/cover.jpg). The browser resolves those against
     * the bare hostname, so they 404 whenever the app is mounted under a path
     * prefix rather than at the domain root (the tailscale worktree dev proxy
     * serves each checkout from https://<host>/<slug>-harun.dev). Running them
     * through asset() pins them to the app's own root instead. Older posts
     * store full GitHub-raw URLs; those are already resolvable and pass through
     * untouched.
     */
    private function resolveCoverImageUrl(mixed $url): ?string
    {
        if (! is_string($url)) {
            return null;
        }

        $url = trim($url);

        if ($url === '') {
            return null;
        }

        // Absolute, protocol-relative, and inline data URLs need no rewriting.
        if (preg_match('#^(?:[a-z][a-z0-9+.-]*:)?//#i', $url) === 1 || str_starts_with($url, 'data:')) {
            return $url;
        }

        return asset($url);
    }

    /**
     * Load view counts for many posts in one query (blog index), and warm the
     * per-slug cache used by individual post pages.
     *
     * @param  list<string>  $slugs
     * @return array<string, int>
     */
    private function viewCountsBySlug(array $slugs): array
    {
        $slugs = array_values(array_unique(array_filter($slugs, fn ($slug) => is_string($slug) && $slug !== '')));

        if ($slugs === []) {
            return [];
        }

        $counts = array_fill_keys($slugs, 0);

        try {
            $rows = DB::table('blog_post_views')
                ->whereIn('slug', $slugs)
                ->get(['slug', 'count']);
        } catch (\Throwable) {
            return $counts;
        }

        foreach ($rows as $row) {
            $counts[$row->slug] = (int) $row->count;
        }

        foreach ($counts as $slug => $count) {
            Cache::put("post.views.{$slug}", $count, 3600);
        }

        return $counts;
    }

    private function contentText(string $html): string
    {
        $text = html_entity_decode(strip_tags($html), ENT_QUOTES | ENT_HTML5, 'UTF-8');
        $text = preg_replace('/\s+/u', ' ', $text) ?? $text;

        return trim($text);
    }
}
