<?php

namespace Tests\Unit;

use App\Support\BlogRepository;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class BlogRepositoryIndexTest extends TestCase
{
    use RefreshDatabase;

    private const SLUG = 'production-ai-code-review-for-terraform-and-lambda-prs';

    protected function setUp(): void
    {
        parent::setUp();

        Cache::flush();
    }

    public function test_cached_payload_omits_html_bodies(): void
    {
        $blog = new BlogRepository;
        $posts = $blog->posts();

        $this->assertNotEmpty($posts);
        $this->assertArrayNotHasKey('content', $posts[0]);
        $this->assertArrayHasKey('contentPath', $posts[0]);

        $serialized = serialize(Cache::get(BlogRepository::cacheKey()));
        $this->assertLessThan(200_000, strlen($serialized), 'metadata cache should stay well under the old ~1.6MB HTML blob');
    }

    public function test_with_content_hydrates_html_from_disk(): void
    {
        $blog = new BlogRepository;
        $post = $blog->find(self::SLUG);

        $this->assertNotNull($post);
        $this->assertArrayNotHasKey('content', $post);

        $hydrated = $blog->withContent($post);

        $this->assertNotEmpty($hydrated['content']['html']);
        $this->assertStringContainsString('<', $hydrated['content']['html']);
    }

    public function test_index_posts_use_absolute_share_urls_without_short_links(): void
    {
        $blog = new BlogRepository;
        $cards = $blog->indexPosts();

        $this->assertNotEmpty($cards);

        foreach ($cards as $card) {
            $this->assertSame($card['canonicalUrl'], $card['shareUrl']);
            $this->assertStringNotContainsString('/s/', $card['shareUrl']);
        }

        $this->assertSame(0, DB::table('short_links')->count());
    }

    public function test_post_page_payload_still_uses_short_share_url(): void
    {
        $blog = new BlogRepository;
        $post = $blog->find(self::SLUG);
        $payload = $blog->toPostPagePayload($post);

        $this->assertNotEmpty($payload['contentHtml']);
        $this->assertMatchesRegularExpression('#^https?://[^/]+/s/[A-Za-z0-9]+$#', $payload['shareUrl']);
    }

    public function test_view_counts_use_a_single_map_cache_key(): void
    {
        DB::table('blog_post_views')->insert([
            'slug' => self::SLUG,
            'count' => 42,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $blog = new BlogRepository;
        $cards = $blog->indexPosts();
        $match = collect($cards)->firstWhere('slug', self::SLUG);

        $this->assertSame(42, $match['viewCount']);
        $this->assertTrue(Cache::has(BlogRepository::viewsMapCacheKey()));
        $this->assertFalse(Cache::has('post.views.'.self::SLUG));
    }
}
