<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class CacheablePublicPageTest extends TestCase
{
    use RefreshDatabase;

    #[Test]
    #[DataProvider('cacheablePaths')]
    public function anonymous_public_pages_are_cookieless_and_edge_cacheable(string $path): void
    {
        $response = $this->get($path)->assertOk();

        $this->assertSame([], $response->headers->getCookies());
        foreach (['public', 'max-age=0', 's-maxage=300', 'stale-while-revalidate=600'] as $directive) {
            $this->assertStringContainsString($directive, (string) $response->headers->get('Cache-Control'));
        }
    }

    public static function cacheablePaths(): array
    {
        return [
            'home' => ['/'],
            'about' => ['/about'],
            'service' => ['/services/devops'],
            'blog index' => ['/blog'],
            'blog post' => ['/blog/ecs-fargate-spot-capacity-providers'],
            'tracking params only' => ['/about?utm_source=newsletter&fbclid=x'],
        ];
    }

    #[Test]
    public function a_session_cookie_keeps_the_page_private_and_cookied(): void
    {
        $response = $this->withUnencryptedCookie(config('session.cookie'), 'x')->get('/services/devops')->assertOk();

        $this->assertStringNotContainsString('s-maxage', (string) $response->headers->get('Cache-Control'));
        $this->assertNotEmpty($response->headers->getCookies());
    }

    #[Test]
    public function a_remember_me_cookie_keeps_the_page_private(): void
    {
        $response = $this->withUnencryptedCookie('remember_web_abc', 'x')->get('/about')->assertOk();

        $this->assertStringNotContainsString('s-maxage', (string) $response->headers->get('Cache-Control'));
        $this->assertNotEmpty($response->headers->getCookies());
    }

    #[Test]
    #[DataProvider('privatePaths')]
    public function other_requests_are_not_marked_public(string $path, array $headers = []): void
    {
        $response = $this->get($path, $headers);

        $this->assertStringNotContainsString('s-maxage', (string) $response->headers->get('Cache-Control'));
    }

    public static function privatePaths(): array
    {
        return [
            'contact form' => ['/contact'],
            'login' => ['/login'],
            'paginated blog' => ['/blog?page=2'],
            'unknown query param' => ['/about?ref=x'],
            'inertia visit' => ['/about', ['X-Inertia' => 'true']],
            'draft preview route' => ['/blog/some-post/draft/00000000000000000000000000000000'],
            'blog feed' => ['/blog/feed.xml'],
        ];
    }

    #[Test]
    public function a_missing_page_is_never_marked_public(): void
    {
        $response = $this->get('/blog/this-post-does-not-exist')->assertNotFound();

        $this->assertStringNotContainsString('s-maxage', (string) $response->headers->get('Cache-Control'));
    }
}
