<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class PingBlogPostTest extends TestCase
{
    use RefreshDatabase;

    private const SLUG = 'production-ai-code-review-for-terraform-and-lambda-prs';

    public function test_pings_indexnow_and_websub_once(): void
    {
        config(['ai.indexnow_key' => '00000000']);
        Http::fake(['api.indexnow.org/*' => Http::response('', 200), 'pubsubhubbub.appspot.com/*' => Http::response('', 204)]);

        $this->artisan('blog:ping', ['slug' => self::SLUG])->assertSuccessful();
        $this->artisan('blog:ping', ['slug' => self::SLUG])->assertSuccessful();

        Http::assertSentCount(2);
        Http::assertSent(fn ($r) => str_contains($r->url(), 'indexnow') && in_array('https://harun.dev/blog/'.self::SLUG, $r['urlList']));
        $this->assertDatabaseHas('blog_crossposts', ['slug' => self::SLUG, 'platform' => 'ping', 'remote_id' => 'indexnow,websub']);
    }

    public function test_failed_pings_are_retried_next_run(): void
    {
        config(['ai.indexnow_key' => '00000000']);
        Http::fake(['*' => Http::response('', 500)]);

        $this->artisan('blog:ping', ['slug' => self::SLUG])->assertSuccessful();

        $this->assertDatabaseMissing('blog_crossposts', ['slug' => self::SLUG, 'platform' => 'ping']);
    }
}
