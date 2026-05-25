<?php

namespace App\Support;

use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use RuntimeException;

class BlogRepository
{
    private const DATA_PATH = 'js/data/harun-blog.json';

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
            ->map(fn (array $post) => $this->summarizePost($post))
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
            ->sortByDesc('publishedAt')
            ->take($limit)
            ->map(fn (array $post) => $this->summarizePost($post))
            ->values()
            ->all();
    }

    /**
     * @return array<string, mixed>
     */
    public function summarizePost(array $post): array
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
            'coverImageUrl' => $post['coverImage']['url'] ?? null,
            'tags' => collect($post['tags'] ?? [])
                ->map(fn (array $tag) => [
                    'name' => $tag['name'],
                    'slug' => $tag['slug'],
                ])
                ->values()
                ->all(),
            'url' => $this->relativeUrl($post['slug']),
            'canonicalUrl' => $this->absoluteUrl($post['slug']),
            'sourceUrl' => $this->sourceUrl($post['slug']),
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
            'contentText' => $post['content']['text'] ?? '',
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

        $path = resource_path(self::DATA_PATH);

        if (! file_exists($path)) {
            throw new RuntimeException("Blog export missing: {$path}");
        }

        $decoded = json_decode(file_get_contents($path), true, 512, JSON_THROW_ON_ERROR);

        if (! is_array($decoded) || ! isset($decoded['publication'], $decoded['posts'])) {
            throw new RuntimeException('Blog export has unexpected shape.');
        }

        $decoded['posts'] = collect($decoded['posts'])
            ->sortByDesc(fn (array $post) => Carbon::parse($post['publishedAt'])->timestamp)
            ->values()
            ->all();

        $this->data = $decoded;

        return $this->data;
    }
}
