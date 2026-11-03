<?php

namespace Tests\Feature;

use App\Console\Commands\PingBlogPost;
use App\Models\BlogCrosspost;
use App\Support\BlogRepository;
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
            && $r['record']['embed']['external']['uri'] === 'https://harun.dev/blog/'.self::SLUG
            && preg_match('/^[2-7a-j][2-7a-z]{12}$/', $r['rkey']));
        Http::assertSent(fn ($r) => str_contains($r->url(), 'mastodon.example/api/v1/statuses')
            && str_contains($r['status'], 'https://harun.dev/blog/'.self::SLUG) && mb_strlen($r['status']) <= 500);
        $this->assertDatabaseHas('blog_crossposts', ['slug' => self::SLUG, 'platform' => 'bluesky', 'remote_url' => 'https://bsky.app/profile/harun.dev/post/3abc']);
        $this->assertDatabaseHas('blog_crossposts', ['slug' => self::SLUG, 'platform' => 'mastodon', 'remote_id' => '9']);
        $this->assertSame(1, BlogCrosspost::where('platform', 'mastodon')->count());
    }

    public function test_bluesky_reuses_a_post_that_exists_when_the_ledger_row_is_missing(): void
    {
        config(['services.bluesky.handle' => 'harun.dev', 'services.bluesky.password' => 'pw']);
        Http::fake([
            'bsky.social/*createSession' => Http::response(['accessJwt' => 'jwt', 'did' => 'did:plc:1']),
            'bsky.social/*getRecord*' => Http::response(['uri' => 'at://did:plc:1/app.bsky.feed.post/3zzz']),
            '*' => Http::response('', 204),
        ]);

        $this->artisan('blog:ping', ['slug' => self::SLUG])->assertSuccessful();

        Http::assertNotSent(fn ($r) => str_contains($r->url(), 'createRecord'));
        $this->assertDatabaseHas('blog_crossposts', ['slug' => self::SLUG, 'platform' => 'bluesky', 'remote_id' => 'at://did:plc:1/app.bsky.feed.post/3zzz']);
    }

    public function test_bluesky_record_key_is_stable_per_post(): void
    {
        $post = ['slug' => self::SLUG, 'publishedAt' => '2026-06-03T09:00:00+00:00'];

        $this->assertSame(PingBlogPost::tid($post), PingBlogPost::tid($post));
        $this->assertMatchesRegularExpression('/^[2-7a-j][2-7a-z]{12}$/', PingBlogPost::tid($post));
        $this->assertNotSame(PingBlogPost::tid($post), PingBlogPost::tid(['slug' => 'other'] + $post));
    }

    public function test_social_failure_is_logged_not_fatal_and_retried(): void
    {
        config(['services.mastodon.instance' => 'https://mastodon.example', 'services.mastodon.token' => 'bad']);
        Http::fake(['mastodon.example/*' => Http::response('unauthorized', 401), '*' => Http::response('', 204)]);

        $this->artisan('blog:ping', ['slug' => self::SLUG])->assertSuccessful();

        $this->assertDatabaseMissing('blog_crossposts', ['slug' => self::SLUG, 'platform' => 'mastodon']);
    }

    public function test_auto_mode_waits_until_the_page_is_live_then_announces(): void
    {
        $blog = new BlogRepository;
        $this->travelTo($blog->effectivePublishedAt($blog->find(self::SLUG))->addMinutes(5));
        config(['ai.indexnow_key' => '00000000']);
        Http::fake([
            'harun.dev/blog/'.self::SLUG => Http::sequence()->push('', 404)->push('ok', 200),
            '*' => Http::response('', 204),
        ]);

        $this->artisan('blog:ping')->assertSuccessful();
        $this->assertDatabaseMissing('blog_crossposts', ['slug' => self::SLUG, 'platform' => 'ping']);

        $this->artisan('blog:ping')->assertSuccessful();
        $this->assertDatabaseHas('blog_crossposts', ['slug' => self::SLUG, 'platform' => 'ping']);
    }
}
