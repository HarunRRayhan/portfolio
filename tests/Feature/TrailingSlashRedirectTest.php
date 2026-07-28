<?php

namespace Tests\Feature;

use App\Http\Middleware\RedirectTrailingSlash;
use Illuminate\Http\Request;
use PHPUnit\Framework\Attributes\Test;
use Symfony\Component\HttpFoundation\Response;
use Tests\TestCase;

class TrailingSlashRedirectTest extends TestCase
{
    /**
     * Laravel's HTTP test helpers ($this->get('/foo/')) strip the trailing
     * slash in prepareUrlForRequest() before the request is even built, so a
     * trailing-slash URL cannot be expressed through them. We therefore drive
     * the middleware directly with a Request that preserves the raw path.
     */
    private function dispatch(string $uri, string $method = 'GET'): Response
    {
        $middleware = new RedirectTrailingSlash();
        $request = Request::create($uri, $method);

        return $middleware->handle($request, fn () => new Response('reached-route'));
    }

    #[Test]
    public function it_redirects_a_trailing_slash_path_to_the_canonical_form(): void
    {
        $response = $this->dispatch('http://127.0.0.1:8123/services/');

        $this->assertSame(301, $response->getStatusCode());
        $this->assertSame('http://127.0.0.1:8123/services', $response->headers->get('Location'));
    }

    #[Test]
    public function it_redirects_a_nested_trailing_slash_path(): void
    {
        $response = $this->dispatch('http://127.0.0.1:8123/blog/production-ai-code-review-for-terraform-and-lambda-prs/');

        $this->assertSame(301, $response->getStatusCode());
        $this->assertSame(
            'http://127.0.0.1:8123/blog/production-ai-code-review-for-terraform-and-lambda-prs',
            $response->headers->get('Location'),
        );
    }

    #[Test]
    public function it_preserves_the_query_string_when_stripping_the_slash(): void
    {
        $response = $this->dispatch('http://127.0.0.1:8123/blog/?page=2&tag=aws');

        $this->assertSame(301, $response->getStatusCode());
        $this->assertSame('http://127.0.0.1:8123/blog?page=2&tag=aws', $response->headers->get('Location'));
    }

    #[Test]
    public function it_leaves_the_bare_homepage_untouched(): void
    {
        $response = $this->dispatch('http://127.0.0.1:8123/');

        $this->assertSame(200, $response->getStatusCode());
        $this->assertSame('reached-route', $response->getContent());
    }

    #[Test]
    public function it_does_not_touch_a_path_without_a_trailing_slash(): void
    {
        $response = $this->dispatch('http://127.0.0.1:8123/services');

        $this->assertSame(200, $response->getStatusCode());
        $this->assertSame('reached-route', $response->getContent());
    }

    #[Test]
    public function it_does_not_redirect_non_get_requests(): void
    {
        $response = $this->dispatch('http://127.0.0.1:8123/services/', 'POST');

        $this->assertSame(200, $response->getStatusCode());
        $this->assertSame('reached-route', $response->getContent());
    }
}
