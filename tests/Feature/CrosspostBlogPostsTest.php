<?php

namespace Tests\Feature;

use App\Console\Commands\CrosspostBlogPosts;
use App\Models\BlogCrosspost;
use App\Support\BlogRepository;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class CrosspostBlogPostsTest extends TestCase
{
    use RefreshDatabase;

    private const SLUG = 'production-ai-code-review-for-terraform-and-lambda-prs';

    public function test_devto_gets_canonical_and_ledger_row_and_hashnode_is_skipped_for_drafts(): void
    {
        config(['services.devto.api_key' => 'k', 'services.hashnode.token' => 't', 'services.hashnode.publication_id' => 'p']);
        Http::fake(['dev.to/*' => Http::response(['id' => 7, 'url' => 'https://dev.to/x/y'])]);

        $this->artisan('blog:crosspost', ['slug' => self::SLUG, '--draft' => true])->assertSuccessful();

        Http::assertSentCount(1);
        Http::assertSent(fn ($r) => $r->hasHeader('api-key', 'k')
            && $r['article']['canonical_url'] === 'https://harun.dev/blog/'.self::SLUG
            && $r['article']['published'] === false
            && count($r['article']['tags']) <= 4);
        $this->assertDatabaseHas('blog_crossposts', ['slug' => self::SLUG, 'platform' => 'devto', 'remote_id' => '7']);
    }

    public function test_rerun_for_same_slug_does_not_duplicate_unless_forced(): void
    {
        config(['services.devto.api_key' => 'k']);
        Http::fake(['dev.to/*' => Http::response(['id' => 7, 'url' => 'https://dev.to/x/y'])]);

        $this->artisan('blog:crosspost', ['slug' => self::SLUG, '--to' => 'devto', '--draft' => true])->assertSuccessful();
        $this->artisan('blog:crosspost', ['slug' => self::SLUG, '--to' => 'devto', '--draft' => true])->assertSuccessful();
        Http::assertSentCount(1);

        $this->artisan('blog:crosspost', ['slug' => self::SLUG, '--to' => 'devto', '--draft' => true, '--force' => true])->assertSuccessful();
        Http::assertSentCount(2);
    }

    public function test_hashnode_looks_up_the_only_publication_when_id_is_unset(): void
    {
        config(['services.hashnode.token' => 't', 'services.hashnode.publication_id' => null]);
        Http::fake(['gql.hashnode.com/*' => Http::sequence()
            ->push(['data' => ['me' => ['publications' => ['edges' => [['node' => ['id' => 'pub1']]]]]]])
            ->push(['data' => ['publishPost' => ['post' => ['id' => 'h1', 'url' => 'https://x.hashnode.dev/y']]]])]);

        $this->artisan('blog:crosspost', ['slug' => self::SLUG, '--to' => 'hashnode'])->assertSuccessful();

        Http::assertSent(fn ($r) => ($r['variables']['input']['publicationId'] ?? null) === 'pub1');
    }

    public function test_hashnode_sends_original_article_url_and_surfaces_graphql_errors(): void
    {
        config(['services.hashnode.token' => 't', 'services.hashnode.publication_id' => 'p']);
        Http::fake(['gql.hashnode.com/*' => Http::response(['errors' => [['message' => 'nope']]])]);

        $this->artisan('blog:crosspost', ['slug' => self::SLUG, '--to' => 'hashnode'])->assertFailed();

        Http::assertSent(fn ($r) => $r['variables']['input']['originalArticleURL'] === 'https://harun.dev/blog/'.self::SLUG);
        $this->assertSame(0, BlogCrosspost::count());
    }

    public function test_auto_mode_skips_old_backlog_and_drafts(): void
    {
        config(['services.devto.api_key' => 'k']);
        Http::fake();

        $this->artisan('blog:crosspost')->assertSuccessful();

        Http::assertNothingSent();
    }

    public function test_activity_div_becomes_demo_link_and_markdown_has_canonical_footer(): void
    {
        $blog = app(BlogRepository::class);
        $markdown = (new \ReflectionMethod(CrosspostBlogPosts::class, 'markdown'))
            ->invoke(new CrosspostBlogPosts, $blog, $blog->find('why-s3-presigned-urls'));

        $this->assertStringNotContainsString('data-blog-activity', $markdown);
        $this->assertStringContainsString('[▶ Try the interactive demo on harun.dev](https://harun.dev/blog/why-s3-presigned-urls)', $markdown);
        $this->assertStringContainsString('https://x.com/harundotdev', $markdown);

        $lb = (new \ReflectionMethod(CrosspostBlogPosts::class, 'markdown'))
            ->invoke(new CrosspostBlogPosts, $blog, $blog->find('eight-load-balancer-algorithms'));
        $this->assertGreaterThanOrEqual(2, substr_count($lb, 'Try the interactive demo'));
        $this->assertStringNotContainsString('<div', $lb);
    }
}
