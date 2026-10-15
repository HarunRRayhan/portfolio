<?php

namespace Tests\Feature;

use App\Models\BlogCrosspost;
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

        Http::assertSentCount(2); // IndexNow + WebSub, no social creds configured
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

    public function test_announces_on_bluesky_and_mastodon_with_link_and_is_idempotent(): void
    {
        config([
            'services.bluesky.handle' => 'harun.dev', 'services.bluesky.password' => 'pw',
            'services.mastodon.instance' => 'https://mastodon.example', 'services.mastodon.token' => 'tok',
        ]);
        Http::fake([
            'bsky.social/*createSession' => Http::response(['accessJwt' => 'jwt', 'did' => 'did:plc:1']),
            'bsky.social/*createRecord' => Http::response(['uri' => 'at://did:plc:1/app.bsky.feed.post/3abc']),
            'mastodon.example/*' => Http::response(['id' => '9', 'url' => 'https://mastodon.example/@h/9']),
            '*' => Http::response('', 204),
        ]);

        $this->artisan('blog:ping', ['slug' => self::SLUG])->assertSuccessful();
        $this->artisan('blog:ping', ['slug' => self::SLUG])->assertSuccessful();

        Http::assertSent(fn ($r) => str_contains($r->url(), 'createRecord')
            && $r['record']['embed']['external']['uri'] === 'https://harun.dev/blog/'.self::SLUG);
        Http::assertSent(fn ($r) => str_contains($r->url(), 'mastodon.example/api/v1/statuses')
            && str_contains($r['status'], 'https://harun.dev/blog/'.self::SLUG) && mb_strlen($r['status']) <= 500);
        $this->assertDatabaseHas('blog_crossposts', ['slug' => self::SLUG, 'platform' => 'bluesky', 'remote_url' => 'https://bsky.app/profile/harun.dev/post/3abc']);
        $this->assertDatabaseHas('blog_crossposts', ['slug' => self::SLUG, 'platform' => 'mastodon', 'remote_id' => '9']);
        $this->assertSame(1, BlogCrosspost::where('platform', 'mastodon')->count());
    }

    public function test_social_failure_is_logged_not_fatal_and_retried(): void
    {
        config(['services.mastodon.instance' => 'https://mastodon.example', 'services.mastodon.token' => 'bad']);
        Http::fake(['mastodon.example/*' => Http::response('unauthorized', 401), '*' => Http::response('', 204)]);

        $this->artisan('blog:ping', ['slug' => self::SLUG])->assertSuccessful();

        $this->assertDatabaseMissing('blog_crossposts', ['slug' => self::SLUG, 'platform' => 'mastodon']);
    }
}
