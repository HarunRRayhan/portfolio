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
    }

    public function test_it_hides_the_count_when_github_fails(): void
    {
        Cache::forget('raystack.github.stars');
        Http::fake(['api.github.com/*' => Http::response('nope', 503)]);

        $this->get('/raystack', $this->inertiaHeaders())->assertOk()->assertJsonPath('props.stars', null);
        $this->assertFalse(Cache::get('raystack.github.stars'));
    }
}
