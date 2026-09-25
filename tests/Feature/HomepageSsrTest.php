<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use App\Models\User;
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

    public function test_unverified_pages_do_not_call_the_renderer(): void
    {
        Http::fake();
        $this->get('/contact')->assertOk();
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
