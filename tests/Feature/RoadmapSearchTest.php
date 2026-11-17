<?php

namespace Tests\Feature;

use App\Models\GithubSponsorship;
use App\Models\User;
use App\Support\RoadmapRepository;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RoadmapSearchTest extends TestCase
{
    use RefreshDatabase;

    public function test_title_matches_rank_first_and_results_link_to_lessons(): void
    {
        $res = $this->getJson('/roadmaps/search?q=lan+vs+wan')->assertOk()->json('results');

        $this->assertSame('LAN vs WAN', $res[0]['title']);
        $this->assertSame('/roadmaps/internet-networking/what-is-a-network/lan-vs-wan', $res[0]['url']);
        $this->assertLessThanOrEqual(20, count($res));
        foreach (['title', 'summary', 'roadmap', 'topic', 'url'] as $k) {
            $this->assertArrayHasKey($k, $res[0]);
        }
    }

    public function test_every_word_must_match_and_short_or_empty_queries_return_nothing(): void
    {
        $this->getJson('/roadmaps/search?q=zzqqxx+dns')->assertOk()->assertJson(['results' => []]);
        $this->getJson('/roadmaps/search?q=d')->assertOk()->assertJson(['results' => []]);
        $this->getJson('/roadmaps/search')->assertOk()->assertJson(['results' => []]);
        $this->getJson('/roadmaps/search?q='.str_repeat('a', 500))->assertOk()->assertJson(['results' => []]);
    }

    public function test_guests_only_find_free_level_lessons_sponsors_find_all(): void
    {
        $repo = new RoadmapRepository;
        $paid = collect($repo->all())->flatMap(fn ($r) => collect($r['stages'])->where('level', '!=', RoadmapRepository::FREE_LEVEL)
            ->flatMap(fn ($s) => collect($s['topics'])->flatMap(fn ($t) => collect($t['lessons'])->map(fn ($l) => [$r['slug'], $t['id'], $l['id'], $l['title']]))))->first();
        [$slug, $topic, $lesson, $title] = $paid;
        $url = "/roadmaps/$slug/$topic/$lesson";
        $urls = fn ($res) => array_column($res, 'url');

        $this->assertNotContains($url, $urls($this->getJson('/roadmaps/search?q='.urlencode($title))->json('results')));

        $user = User::factory()->create();
        GithubSponsorship::create([
            'github_sponsor_id' => '9', 'github_login' => 'x', 'user_id' => $user->id, 'kind' => GithubSponsorship::KIND_MONTHLY,
            'status' => GithubSponsorship::STATUS_ACTIVE, 'source' => GithubSponsorship::SOURCE_WEBHOOK, 'monthly_price_cents' => 500, 'started_at' => now(),
        ]);
        $this->assertContains($url, $urls($this->actingAs($user)->getJson('/roadmaps/search?q='.urlencode($title))->json('results')));
    }

    public function test_search_route_is_not_swallowed_by_the_roadmap_slug_route(): void
    {
        $this->get('/roadmaps/search?q=dns', ['Accept' => 'application/json'])->assertOk()->assertJsonStructure(['results']);
    }
}
