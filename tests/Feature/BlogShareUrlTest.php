<?php

namespace Tests\Feature;

use App\Models\ShortLink;
use App\Support\BlogRepository;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BlogShareUrlTest extends TestCase
{
    use RefreshDatabase;

    private const SLUG = 'production-ai-code-review-for-terraform-and-lambda-prs';

    public function test_blog_index_cards_use_canonical_share_url(): void
    {
        $response = $this->get('/blog');

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->has('posts.0.shareUrl')
            ->where('posts.0.shareUrl', fn (string $shareUrl) => ! str_contains($shareUrl, '/s/'))
            ->where('posts.0.shareUrl', fn (string $shareUrl) => str_starts_with($shareUrl, 'http'))
        );
    }

    public function test_summarize_post_exposes_a_shortened_share_url(): void
    {
        $blog = app(BlogRepository::class);
        $post = $blog->find(self::SLUG);
        $summary = $blog->summarizePost($post);

        $this->assertMatchesRegularExpression('#^https?://[^/]+/s/[A-Za-z0-9]+$#', $summary['shareUrl']);
        $this->assertSame($blog->absoluteUrl(self::SLUG), $summary['canonicalUrl']);
    }

    public function test_repeated_reads_reuse_the_same_short_link(): void
    {
        $blog = app(BlogRepository::class);
        $post = $blog->find(self::SLUG);

        $first = $blog->summarizePost($post)['shareUrl'];
        $second = $blog->summarizePost($post)['shareUrl'];

        $this->assertSame($first, $second);
        $this->assertSame(1, ShortLink::count());
    }

    public function test_blog_post_route_returns_a_shortened_share_url(): void
    {
        $response = $this->get('/blog/'.self::SLUG);

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->where('post.canonicalUrl', app(BlogRepository::class)->absoluteUrl(self::SLUG))
            ->has('post.shareUrl')
            ->where('post.shareUrl', fn (string $shareUrl) => str_contains($shareUrl, '/s/'))
        );
    }
}
