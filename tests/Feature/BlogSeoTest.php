<?php

namespace Tests\Feature;

use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class BlogSeoTest extends TestCase
{
    #[Test]
    public function it_exposes_the_blog_index_in_the_sitemap_without_a_trailing_slash(): void
    {
        $response = $this->get('/sitemap.xml');
        $canonical = rtrim(config('app.url', url('/')), '/') . '/blog';

        $response->assertOk();
        $response->assertSee('<loc>' . $canonical . '</loc>', false);
        $response->assertDontSee('<loc>' . $canonical . '/</loc>', false);
    }

    #[Test]
    public function it_keeps_draft_posts_out_of_the_blog_index_and_sitemap(): void
    {
        $draftUrl = rtrim(config('app.url', url('/')), '/') . '/blog/how-i-make-ai-coding-agents-safe-in-a-real-aws-codebase';

        $indexResponse = $this->get('/blog');
        $sitemapResponse = $this->get('/sitemap.xml');

        $indexResponse->assertOk();
        $indexResponse->assertDontSee('How I Make AI Coding Agents Safe in a Real AWS Codebase', false);

        $sitemapResponse->assertOk();
        $sitemapResponse->assertDontSee('<loc>' . $draftUrl . '</loc>', false);
    }

    #[Test]
    public function it_hides_draft_posts_behind_a_private_preview_link(): void
    {
        $draftSlug = 'llm-observability-langfuse-lambda-cloudwatch';
        $draftUrl = rtrim(config('app.url', url('/')), '/') . '/blog/' . $draftSlug;
        $previewUrl = $draftUrl . '/draft/0af04d79dcd1e37ac9f5723c01ee4d0f';

        $directResponse = $this->get('/blog/' . $draftSlug);
        $previewResponse = $this->get('/blog/' . $draftSlug . '/draft/0af04d79dcd1e37ac9f5723c01ee4d0f');

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
        $response = $this->get('/blog/how-i-make-ai-coding-agents-safe-in-a-real-aws-codebase');

        $response->assertNotFound();
    }
}
