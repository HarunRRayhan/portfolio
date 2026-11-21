<?php

namespace App\Support;

use App\Models\NewsletterCampaign;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

/** Post selection shared by the weekly send and the admin template preview. */
class NewsletterIssue
{
    public function __construct(private BlogRepository $blog) {}

    /** @return Collection<int, array<string, mixed>> Published posts, newest first. */
    public function publishedPosts(Carbon $now): Collection
    {
        return collect($this->blog->indexPosts())
            ->filter(fn (array $post): bool => ! (bool) ($post['isDraft'] ?? false))
            ->filter(fn (array $post): bool => Carbon::parse((string) $post['publishedAt'])->lte($now))
            ->values();
    }

    /** @return Collection<int, array<string, mixed>> Published in the seven days before $now. */
    public function recentPosts(Carbon $now): Collection
    {
        $windowStart = $now->copy()->subDays(7);

        return $this->publishedPosts($now)
            ->filter(fn (array $post): bool => Carbon::parse((string) $post['publishedAt'])->gt($windowStart))
            ->values();
    }

    /** @return Collection<int, array{slug: string, title: string, summary: string, url: string}> Roadmaps added or updated in the seven days before $now. */
    public function recentRoadmaps(Carbon $now): Collection
    {
        $repo = new RoadmapRepository;
        $windowStart = $now->copy()->subDays(7)->startOfDay();

        return collect($repo->all())
            ->filter(fn (array $r): bool => Carbon::parse((string) $r['updated'])->betweenIncluded($windowStart, $now))
            ->map(fn (array $r): array => [
                'slug' => $r['slug'],
                'title' => $r['title'],
                'summary' => $r['summary'],
                'url' => $repo->absoluteUrl($r['slug']),
            ])
            ->values();
    }

    /**
     * Adds a newsletterExcerpt (the first two paragraphs) to the lead post when it has a brief.
     *
     * @param  Collection<int, array<string, mixed>>  $posts
     * @return Collection<int, array<string, mixed>>
     */
    public function withLeadExcerpt(Collection $posts): Collection
    {
        return $posts->map(function (array $post, int $index): array {
            if ($index !== 0 || ! isset($post['brief'])) {
                return $post;
            }

            $source = $this->blog->find((string) $post['slug']);

            if (! $source) {
                return $post;
            }

            $content = $this->blog->withContent($source);
            preg_match_all('/<p\b[^>]*>(.*?)<\/p>/si', (string) $content['content']['html'], $paragraphs);
            $intro = collect(array_slice($paragraphs[1], 0, 2))
                ->map(fn (string $paragraph): string => trim(html_entity_decode(strip_tags($paragraph), ENT_QUOTES | ENT_HTML5, 'UTF-8')))
                ->filter()
                ->implode(' ');

            if ($intro !== '') {
                $post['newsletterExcerpt'] = Str::limit($intro, 500, '…');
            }

            return $post;
        });
    }

    /** @return array<int, array<string, string>> */
    public function tweets(): array
    {
        return collect(config('newsletter.tweets', []))
            ->filter(fn (array $tweet): bool => ! empty($tweet['text']) && ! empty($tweet['url']))
            ->take(3)
            ->values()
            ->all();
    }

    /**
     * The pinned product (CloudPloy) always leads; the second slot rotates least-shown first,
     * never last week's when avoidable, so the other products share the airtime evenly.
     *
     * @return array<int, array<string, string>>
     */
    public function chooseProducts(?string $exceptKey = null): array
    {
        $products = collect(config('newsletter.products', []))->unique('key');
        $pinnedKey = config('newsletter.pinned_product');
        $history = NewsletterCampaign::query()
            ->when($exceptKey, fn ($query) => $query->where('key', '!=', $exceptKey))
            ->whereNotNull('products')
            ->latest('id')
            ->pluck('products');
        $shown = $history->flatten(1)->countBy('key');
        $lastWeek = collect($history->first() ?? [])->pluck('key');

        $rotating = $products
            ->reject(fn (array $product): bool => $product['key'] === $pinnedKey)
            ->shuffle()
            // Fewest showings first; among equals, skip last week's so nothing repeats back to back.
            ->sortBy(fn (array $product): int => $shown->get($product['key'], 0) * 2 + (int) $lastWeek->contains($product['key']));

        return collect([$products->firstWhere('key', $pinnedKey)])
            ->filter()
            ->concat($rotating)
            ->take(2)
            ->values()
            ->all();
    }
}
