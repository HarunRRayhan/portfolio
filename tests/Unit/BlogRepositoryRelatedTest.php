<?php

namespace Tests\Unit;

use App\Support\BlogRepository;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\Support\CreatesDraftBlogPost;
use Tests\TestCase;

class BlogRepositoryRelatedTest extends TestCase
{
    use CreatesDraftBlogPost;
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Cache::flush();
    }

    public function test_related_posts_prefer_shared_tags_over_newer_unrelated_posts(): void
    {
        $blog = new BlogRepository;
        $related = $blog->related('deploy-wordpress-app-to-amazon-lightsail', 3);

        $this->assertCount(3, $related);
        $this->assertNotContains(
            'agentcore-gateway-private-ca-without-the-alb',
            array_column($related, 'slug'),
        );

        $sourceTags = array_column($blog->find('deploy-wordpress-app-to-amazon-lightsail')['tags'], 'slug');
        $newerOverlap = count(array_intersect(
            $sourceTags,
            array_column($blog->find('agentcore-gateway-private-ca-without-the-alb')['tags'], 'slug'),
        ));

        foreach ($related as $post) {
            $overlap = count(array_intersect($sourceTags, array_column($post['tags'], 'slug')));
            $this->assertGreaterThan($newerOverlap, $overlap);
        }
    }

    public function test_related_posts_fall_back_to_recent_posts_when_tags_do_not_overlap(): void
    {
        $draft = $this->createDraftBlogPost();
        $blog = new BlogRepository;
        $newest = collect($blog->posts())
            ->reject(fn (array $post) => (bool) ($post['draft'] ?? false))
            ->sortByDesc('publishedAt')
            ->take(3)
            ->pluck('slug')
            ->all();

        $related = collect($blog->related($draft['slug'], 3))->pluck('slug')->all();

        $this->assertSame($newest, $related);
    }
}
