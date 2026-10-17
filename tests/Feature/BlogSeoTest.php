<?php

namespace Tests\Feature;

use App\Models\User;
use App\Support\SeoCatalog;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Tests\Support\CreatesDraftBlogPost;
use Tests\TestCase;

class BlogSeoTest extends TestCase
{
    use CreatesDraftBlogPost;
    use RefreshDatabase;

    #[Test]
    public function seo_title_frontmatter_shortens_the_title_tag_but_not_the_headline(): void
    {
        $html = $this->get('/blog/ecs-fargate-spot-capacity-providers')->assertOk()->getContent();

        $this->assertStringContainsString('<title data-inertia="">ECS Fargate Spot: Saving 70% on Container Hosting | Harun&#039;s Blog</title>', $html);
        $this->assertStringContainsString('"headline":"ECS Fargate Spot + Capacity Providers - Saving 70% on Container Hosting"', $html);
    }

    #[Test]
    public function it_exposes_the_blog_index_in_the_sitemap_without_a_trailing_slash(): void
    {
        $response = $this->get('/sitemap.xml');
        $canonical = rtrim(config('app.url', url('/')), '/').'/blog';

        $response->assertOk();
        $response->assertSee('<loc>'.$canonical.'</loc>', false);
        $response->assertDontSee('<loc>'.$canonical.'/</loc>', false);
    }

    #[Test]
    public function it_keeps_draft_posts_out_of_the_blog_index_and_sitemap(): void
    {
        $draft = $this->createDraftBlogPost();
        $draftUrl = rtrim(config('app.url', url('/')), '/').'/blog/'.$draft['slug'];

        $indexResponse = $this->get('/blog');
        $sitemapResponse = $this->get('/sitemap.xml');

        $indexResponse->assertOk();
        $indexResponse->assertDontSee($draft['title'], false);

        $sitemapResponse->assertOk();
        $sitemapResponse->assertDontSee('<loc>'.$draftUrl.'</loc>', false);
    }

    #[Test]
    public function it_hides_draft_posts_behind_an_admin_preview(): void
    {
        $draft = $this->createDraftBlogPost();
        $draftSlug = $draft['slug'];
        $preview = '/blog/'.$draftSlug.'/draft/'.$draft['token'];

        $this->get('/blog/'.$draftSlug)->assertNotFound();
        $this->get($preview)->assertRedirect('/login');

        $reader = User::factory()->create([
            'role' => 'user',
            'email_verified_at' => now(),
        ]);
        $this->actingAs($reader)->get($preview)->assertForbidden();

        $admin = User::factory()->create([
            'role' => 'admin',
            'email_verified_at' => now(),
        ]);
        $previewResponse = $this->actingAs($admin)->get($preview);

        $previewResponse->assertOk();
        $previewResponse->assertSee('noindex, nofollow, noarchive', false);
        $this->actingAs($admin)->get('/blog/'.$draftSlug.'/draft/'.str_repeat('a', 32))->assertNotFound();
    }

    #[Test]
    public function it_marks_published_posts_as_indexable(): void
    {
        $response = $this->get('/blog/production-ai-code-review-for-terraform-and-lambda-prs');

        $response->assertOk();
        $response->assertDontSee('noindex, nofollow, noarchive', false);
    }

    #[Test]
    public function it_drops_the_title_suffix_past_70_characters_and_clamps_descriptions(): void
    {
        $canonical = 'https://harun.dev/blog/example';

        $short = SeoCatalog::forBlogPost('Short title', 'Body text.', $canonical, null)->toArray();
        $this->assertSame("Short title | Harun's Blog", $short['title']);

        $long = SeoCatalog::forBlogPost(str_repeat('A', 60), 'Body text.', $canonical, null)->toArray();
        $this->assertSame(str_repeat('A', 60), $long['title']);

        $clamped = SeoCatalog::forBlogPost('Short title', str_repeat('lorem ipsum ', 40), $canonical, null)->toArray();
        $this->assertLessThanOrEqual(160, mb_strlen($clamped['description']));
        $this->assertStringEndsWith(' ipsum…', $clamped['description']);
    }

    #[Test]
    public function it_marks_draft_posts_as_noindex_when_rendered_directly(): void
    {
        $draft = $this->createDraftBlogPost();
        $response = $this->get('/blog/'.$draft['slug']);

        $response->assertNotFound();
    }
}
