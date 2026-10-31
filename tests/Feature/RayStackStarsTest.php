<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class RayStackStarsTest extends TestCase
{
    public function test_it_shows_the_github_star_count_and_caches_it(): void
    {
        Cache::forget('raystack.github.stars');
        Http::fake(['api.github.com/repos/HarunRRayhan/RayStack' => Http::response(['stargazers_count' => 42])]);

        $this->get('/raystack', $this->inertiaHeaders())->assertOk()->assertJsonPath('props.stars', 42);
        $this->get('/raystack', $this->inertiaHeaders())->assertJsonPath('props.stars', 42);

        Http::assertSentCount(1);
        $this->assertSame(42, Cache::get('raystack.github.stars'));
    }

    public function test_it_hides_the_count_when_github_fails(): void
    {
        Cache::forget('raystack.github.stars');
        Cache::forget('raystack.github.version');
        Http::fake(['api.github.com/*' => Http::response('nope', 503)]);

        $this->get('/raystack', $this->inertiaHeaders())->assertOk()->assertJsonPath('props.stars', null);
        $this->assertFalse(Cache::get('raystack.github.stars'));
        $this->assertFalse(Cache::get('raystack.github.version'));
    }

    public function test_it_shows_the_latest_release_tag_and_caches_it(): void
    {
        Cache::forget('raystack.github.version');
        Http::fake(['api.github.com/repos/HarunRRayhan/RayStack/releases/latest' => Http::response(['tag_name' => 'v1.2.3'])]);

        $this->get('/raystack', $this->inertiaHeaders())->assertOk()->assertJsonPath('props.version', 'v1.2.3');
        $this->assertSame('v1.2.3', Cache::get('raystack.github.version'));
    }

    public function test_it_falls_back_when_there_is_no_release(): void
    {
        Cache::forget('raystack.github.version');
        Http::fake(['api.github.com/repos/HarunRRayhan/RayStack/releases/latest' => Http::response(['message' => 'Not Found'], 404)]);

        $this->get('/raystack', $this->inertiaHeaders())->assertOk()->assertJsonPath('props.version', null);
        $this->assertFalse(Cache::get('raystack.github.version'));
    }

    public function test_it_ignores_a_tag_that_is_not_a_version(): void
    {
        Cache::forget('raystack.github.version');
        Http::fake(['api.github.com/repos/HarunRRayhan/RayStack/releases/latest' => Http::response(['tag_name' => '<b>nightly</b>'])]);

        $this->get('/raystack', $this->inertiaHeaders())->assertOk()->assertJsonPath('props.version', null);
        $this->assertFalse(Cache::get('raystack.github.version'));
    }
}
