<?php

namespace Tests\Feature;

use App\Models\User;
use App\Support\BlogRepository;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Tests\TestCase;

class HomepageSsrTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config(['inertia.ssr.enabled' => true, 'inertia.ssr.ensure_bundle_exists' => false]);
    }

    public function test_homepage_uses_server_rendered_body(): void
    {
        Http::fake(['127.0.0.1:13714/*' => Http::response([
            'head' => [], 'body' => '<div id="app"><h1>Server rendered homepage</h1></div>',
        ])]);

        $this->get('/')->assertOk()->assertSee('<h1>Server rendered homepage</h1>', false);
        Http::assertSent(fn ($request) => $request['component'] === 'Homepage');
    }

    public function test_published_blog_pages_use_the_renderer(): void
    {
        Http::fake(['127.0.0.1:13714/*' => Http::response([
            'head' => [], 'body' => '<div id="app"><h1>Server rendered blog</h1></div>',
        ])]);
        $this->get('/blog')->assertOk()->assertSee('<h1>Server rendered blog</h1>', false);
        Http::assertSent(fn ($request) => $request['component'] === 'Blog/Index');
    }

    public function test_published_post_uses_the_renderer(): void
    {
        Http::fake(['127.0.0.1:13714/*' => Http::response([
            'head' => [], 'body' => '<div id="app"><h1>Server rendered blog</h1></div>',
        ])]);
        $post = (new BlogRepository)->indexPosts()[0];
        $this->get($post['url'])->assertOk()->assertSee('<h1>Server rendered blog</h1>', false);
        Http::assertSent(fn ($request) => $request['component'] === 'Blog/Post');
    }

    public function test_authenticated_blog_does_not_call_the_renderer(): void
    {
        Http::fake();
        $this->actingAs(User::factory()->create())->get('/blog')->assertOk();
        Http::assertNothingSent();
    }

    public function test_draft_preview_never_calls_the_renderer(): void
    {
        Http::fake();
        // Exercise the named preview boundary without adding a draft to the shipped catalog.
        Route::middleware('web')->get('/ssr-preview-fixture',
            fn () => Inertia::render('Blog/Post', ['post' => ['isDraft' => true]])
        )->name('blog.preview');
        $this->get('/ssr-preview-fixture')->assertOk();
        Http::assertNothingSent();
    }

    public function test_services_hub_uses_the_renderer(): void
    {
        Http::fake(['127.0.0.1:13714/*' => Http::response([
            'head' => [], 'body' => '<div id="app"><h1>Server rendered services</h1></div>',
        ])]);

        $this->get('/services')->assertOk()->assertSee('<h1>Server rendered services</h1>', false);
        Http::assertSent(fn ($request) => $request['component'] === 'Services');
    }

    public function test_service_page_uses_the_renderer(): void
    {
        Http::fake(['127.0.0.1:13714/*' => Http::response([
            'head' => [], 'body' => '<div id="app"><h1>Server rendered performance</h1></div>',
        ])]);

        $this->get('/services/performance-optimization')->assertOk()
            ->assertSee('<h1>Server rendered performance</h1>', false);
        Http::assertSent(fn ($request) => $request['component'] === 'Services/PerformanceOptimization');
    }

    public function test_products_page_uses_the_renderer(): void
    {
        Http::fake(['127.0.0.1:13714/*' => Http::response([
            'head' => [], 'body' => '<div id="app"><h1>Server rendered products</h1></div>',
        ])]);

        $this->get('/products')->assertOk()->assertSee('<h1>Server rendered products</h1>', false);
        Http::assertSent(fn ($request) => $request['component'] === 'Products');
    }

    public static function publicContentPages(): array
    {
        return [
            ['/about', 'About'], ['/contact', 'Contact'], ['/privacy', 'Privacy'], ['/terms', 'Terms'],
            ['/bio', 'Bio'], ['/hrr', 'Bio'], ['/sponsor-me', 'Sponsor'], ['/case-studies', 'CaseStudies/Index'],
            ['/videos', 'Media/Index'], ['/slides', 'Media/Index'],
        ];
    }

    #[\PHPUnit\Framework\Attributes\DataProvider('publicContentPages')]
    public function test_public_content_pages_use_the_renderer(string $path, string $component): void
    {
        Http::fake(['127.0.0.1:13714/*' => Http::response([
            'head' => [], 'body' => '<div id="app"><h1>Server rendered page</h1></div>',
        ])]);

        $this->get($path)->assertOk()->assertSee('<h1>Server rendered page</h1>', false);
        Http::assertSent(fn ($request) => $request['component'] === $component);
    }

    public function test_unlisted_pages_do_not_call_the_renderer(): void
    {
        Http::fake();
        $this->get('/login')->assertOk();
        Http::assertNothingSent();
    }

    public function test_authenticated_homepage_keeps_full_styles_and_client_rendering(): void
    {
        Http::fake();
        $this->actingAs(User::factory()->create())
            ->get('/')
            ->assertOk()
            ->assertDontSee('data-homepage-critical', false)
            ->assertDontSee('data-deferred-app-styles', false);
        Http::assertNothingSent();
    }

    public function test_homepage_falls_back_when_renderer_is_unavailable(): void
    {
        Http::fake(['127.0.0.1:13714/*' => Http::response([], 503)]);
        $this->get('/')->assertOk()->assertSee('<div id="app"></div>', false);
    }
}
