<?php

namespace App\Support;

use Illuminate\Support\Carbon;
use RuntimeException;
use Symfony\Component\Yaml\Yaml;

class BlogRepository
{
    private const CONTENT_DIR = 'blog/posts';

    private const PUBLICATION_PATH = 'blog/publication.yml';

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
        return collect($this->posts())
            ->reject(fn (array $post) => (bool) ($post['draft'] ?? false))
            ->map(fn (array $post) => $this->summarizePost($post))
            ->values()
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
    public function summarizePost(array $post): array
    {
        $contentHtml = $post['content']['html'] ?? '';

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
            'coverImageUrl' => $post['coverImageUrl'] ?? null,
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
            'sourceUrl' => $post['sourceUrl'] ?? $this->sourceUrl($post['slug']),
            'contentText' => $this->contentText($contentHtml),
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

        $publication = $this->loadPublication();
        $posts = collect(glob(resource_path(self::CONTENT_DIR.'/*.md')) ?: [])
            ->map(fn (string $path) => $this->parsePostFile($path, $publication))
            ->sortByDesc(fn (array $post) => Carbon::parse($post['publishedAt'])->timestamp)
            ->values()
            ->all();

        $this->data = [
            'publication' => $publication,
            'posts' => $posts,
        ];

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

    private function contentText(string $html): string
    {
        $text = html_entity_decode(strip_tags($html), ENT_QUOTES | ENT_HTML5, 'UTF-8');
        $text = preg_replace('/\s+/u', ' ', $text) ?? $text;

        return trim($text);
    }
}
