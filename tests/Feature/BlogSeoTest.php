<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Tests\Support\CreatesDraftBlogPost;
use Tests\TestCase;

class BlogSeoTest extends TestCase
{
    use CreatesDraftBlogPost;
    use RefreshDatabase;

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
    public function it_hides_draft_posts_behind_a_private_preview_link(): void
    {
        $draft = $this->createDraftBlogPost();
        $draftSlug = $draft['slug'];

        $directResponse = $this->get('/blog/'.$draftSlug);
        $previewResponse = $this->get('/blog/'.$draftSlug.'/draft/'.$draft['token']);

        $directResponse->assertNotFound();
        $previewResponse->assertOk();
        $previewResponse->assertSee('noindex, nofollow, noarchive', false);
    }

    #[Test]
    public function it_marks_published_posts_as_indexable(): void
    {
        $response = $this->get('/blog/production-ai-code-review-for-terraform-and-lambda-prs');

        $response->assertOk();
        $response->assertDontSee('noindex, nofollow, noarchive', false);
    }

    #[Test]
    public function it_marks_draft_posts_as_noindex_when_rendered_directly(): void
    {
        $draft = $this->createDraftBlogPost();
        $response = $this->get('/blog/'.$draft['slug']);

        $response->assertNotFound();
    }
}
