<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class LegacyBlogRedirectTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
    }

    #[Test]
    public function it_sends_the_old_blog_host_to_the_canonical_url_in_one_hop(): void
    {
        $this->get('http://blog.harun.dev/')
            ->assertStatus(301)
            ->assertRedirect('https://harun.dev/blog');

        $this->get('http://blog.harun.dev/production-ai-code-review-for-terraform-and-lambda-prs')
            ->assertStatus(301)
            ->assertRedirect('https://harun.dev/blog/production-ai-code-review-for-terraform-and-lambda-prs');

        $this->get('http://blog.harun.dev/tag/lightsail?ref=old')
            ->assertStatus(301)
            ->assertRedirect('https://harun.dev/blog?ref=old');

        $this->get('http://blog.harun.dev/rss.xml')
            ->assertStatus(301)
            ->assertRedirect('https://harun.dev/blog/feed.xml');

        $this->get('http://blog.harun.dev/sitemap.xml')
            ->assertStatus(301)
            ->assertRedirect('https://harun.dev/sitemap.xml');
    }

    #[Test]
    public function it_redirects_legacy_paths_on_the_current_host_to_a_live_page(): void
    {
        $this->get('/blog/tag/lightsail')
            ->assertStatus(301)
            ->assertRedirect('/blog');

        $this->get('/blog/page/2')
            ->assertStatus(301)
            ->assertRedirect('/blog');

        $this->get('/feed')
            ->assertStatus(301)
            ->assertRedirect('/blog/feed.xml');

        $this->get('/rss')
            ->assertStatus(301)
            ->assertRedirect('/blog/feed.xml');

        $this->get('/blog/feed?utm=1')
            ->assertStatus(301)
            ->assertRedirect('/blog/feed.xml?utm=1');

        $this->get('/blog')->assertOk();
        $this->get('/blog/feed.xml')->assertOk();
        $this->get('/blog/production-ai-code-review-for-terraform-and-lambda-prs')->assertOk();
    }
}
