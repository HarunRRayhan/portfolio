<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class AiReadinessTest extends TestCase
{
    use RefreshDatabase;

    #[Test]
    public function robots_txt_allows_ai_training_and_blocks_private_and_seo_scrapers(): void
    {
        $response = $this->get('/robots.txt')->assertOk();
        $body = $response->getContent();
        $siteUrl = rtrim((string) config('app.url'), '/');

        $cacheControl = (string) $response->headers->get('Cache-Control');
        $this->assertStringContainsString('public', $cacheControl);
        $this->assertStringContainsString('max-age=900', $cacheControl);
        $this->assertStringContainsString('Content-Signal: search=yes, ai-input=yes, ai-train=yes', $body);
        $this->assertStringContainsString($siteUrl.'/llms-full.txt', $body);
        $this->assertStringContainsString('Disallow: /admin', $body);
        $this->assertStringContainsString('Disallow: /login', $body);
        $this->assertStringContainsString("User-agent: AhrefsBot\nDisallow: /", $body);
        $this->assertStringNotContainsString('ai-train=no', $body);
    }

    #[Test]
    public function llms_txt_tells_answer_engines_how_to_hire(): void
    {
        $siteUrl = rtrim((string) config('app.url'), '/');
        $body = $this->get('/llms.txt')->assertOk()->getContent();

        $this->assertStringContainsString('## Hire', $body);
        $this->assertStringContainsString($siteUrl.'/consultation', $body);
        $this->assertStringContainsString('/services/devops', $body);
        $this->assertStringContainsString('Training and retrieval are welcome if you link back', $body);
    }

    #[Test]
    public function html_points_answer_engines_at_the_llm_index_and_bing_verification(): void
    {
        $this->withoutVite();

        $html = $this->get('/')->assertOk()->getContent();
        $siteUrl = rtrim((string) config('app.url'), '/');

        $this->assertStringContainsString(
            'rel="alternate" type="text/markdown" href="'.$siteUrl.'/llms.txt"',
            $html,
        );
        $this->assertStringNotContainsString('msvalidate.01', $html);

        config(['ai.bing_site_verification' => 'ABCDEF123456']);

        $verified = $this->get('/')->assertOk()->getContent();
        $this->assertStringContainsString('name="msvalidate.01" content="ABCDEF123456"', $verified);
    }

    #[Test]
    public function bulk_clients_are_capped_and_named_ai_crawlers_keep_a_higher_budget(): void
    {
        config([
            'ai.crawl_limit_enabled' => true,
            'ai.limits.bulk' => 2,
            'ai.limits.search_ai' => 5,
        ]);

        $bulk = [
            'CF-Connecting-IP' => '203.0.113.50',
            'User-Agent' => 'curl/8.7.1',
        ];

        $this->withHeaders($bulk)->get('/robots.txt')->assertOk();
        $this->withHeaders($bulk)->get('/robots.txt')->assertOk();
        $blocked = $this->withHeaders($bulk)->get('/robots.txt');
        $blocked->assertStatus(429);
        $blocked->assertHeader('Retry-After');
        $this->assertStringContainsString('/llms.txt', $blocked->getContent());

        $this->withHeaders([
            'CF-Connecting-IP' => '203.0.113.50',
            'User-Agent' => 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; GPTBot/1.2; +https://openai.com/gptbot',
        ])->get('/robots.txt')->assertOk();

        $this->withHeaders($bulk)->post('/login', [])->assertRedirect();
    }

    #[Test]
    public function indexnow_key_file_is_served_only_for_the_configured_key(): void
    {
        config(['ai.indexnow_key' => '0123456789abcdef']);

        $this->get('/0123456789abcdef.txt')
            ->assertOk()
            ->assertSee('0123456789abcdef', false);

        $this->get('/ffffffffffffffff.txt')->assertNotFound();
        $this->get('/llms.txt')->assertOk();
    }

    #[Test]
    public function indexnow_submits_the_public_sitemap_to_the_shared_endpoint(): void
    {
        Http::fake([
            'https://api.indexnow.org/indexnow' => Http::response('', 202),
        ]);

        config(['ai.indexnow_key' => '0123456789abcdef']);

        $this->artisan('seo:indexnow', ['--site' => 'https://harun.dev'])->assertSuccessful();

        Http::assertSent(function ($request): bool {
            $data = $request->data();

            return $request->url() === 'https://api.indexnow.org/indexnow'
                && ($data['host'] ?? null) === 'harun.dev'
                && ($data['key'] ?? null) === '0123456789abcdef'
                && ($data['keyLocation'] ?? null) === 'https://harun.dev/0123456789abcdef.txt'
                && in_array('https://harun.dev/consultation', $data['urlList'] ?? [], true);
        });
    }

    #[Test]
    public function indexnow_refuses_to_submit_a_local_origin(): void
    {
        config([
            'app.url' => 'http://localhost',
            'ai.indexnow_key' => '0123456789abcdef',
        ]);

        $this->artisan('seo:indexnow')->assertFailed();
    }

    #[Test]
    public function the_readiness_command_passes_when_the_crawl_budget_is_on(): void
    {
        config(['ai.crawl_limit_enabled' => true]);

        $this->artisan('seo:ai-readiness')
            ->expectsOutputToContain('PASS robots.txt allows search, live AI answers, and training.')
            ->expectsOutputToContain('WARN INDEXNOW_KEY is empty')
            ->assertSuccessful();
    }

    #[Test]
    public function the_readiness_command_can_check_the_live_site_responses(): void
    {
        config(['ai.crawl_limit_enabled' => true]);

        Http::fake([
            'https://harun.dev/robots.txt' => Http::response(
                "Content-Signal: search=yes, ai-input=yes, ai-train=yes\nSitemap: https://harun.dev/sitemap.xml\n",
                200,
            ),
            'https://harun.dev/llms.txt' => Http::response(
                "## Hire\nhttps://harun.dev/consultation\n",
                200,
            ),
        ]);

        $this->artisan('seo:ai-readiness', ['--live' => true])->assertSuccessful();
    }

    #[Test]
    public function publishing_a_scheduled_post_notifies_indexnow_and_clears_the_llm_index(): void
    {
        Http::fake([
            'https://api.indexnow.org/indexnow' => Http::response('', 200),
        ]);

        $slug = 'test-draft-'.Str::lower(Str::random(12));
        $path = resource_path("blog/posts/{$slug}.md");
        file_put_contents($path, <<<MARKDOWN
---
title: "Temporary Draft Post"
slug: "{$slug}"
draft: true
draftToken: "abcd"
brief: "Temporary draft used by the test suite."
publishedAt: "2020-01-01T00:00:00.000Z"
readTimeInMinutes: 1
tags: []
---
This draft exists only for this test.
MARKDOWN);
        $this->beforeApplicationDestroyed(function () use ($path): void {
            @unlink($path);
            Cache::forget('llms.txt.v1');
        });

        config([
            'app.url' => 'https://harun.dev',
            'ai.indexnow_key' => '0123456789abcdef',
        ]);
        Cache::put('llms.txt.v1', 'stale', 900);

        $this->artisan('blog:publish-scheduled')
            ->expectsOutputToContain('Notified IndexNow about 1 new post URL(s).')
            ->assertSuccessful();

        $this->assertNull(Cache::get('llms.txt.v1'));
        $this->assertIsString($contents = file_get_contents($path));
        $this->assertStringNotContainsString('draft: true', $contents);

        Http::assertSent(function ($request) use ($slug): bool {
            $data = $request->data();

            return $request->url() === 'https://api.indexnow.org/indexnow'
                && ($data['urlList'] ?? null) === ['https://harun.dev/blog/'.$slug];
        });
    }
}
