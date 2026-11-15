<?php

namespace Tests\Feature;

use App\Models\GithubSponsorship;
use App\Models\RoadmapProgress;
use App\Models\RoadmapStart;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RoadmapPagesTest extends TestCase
{
    use RefreshDatabase;

    private function sponsorUser(): User
    {
        $user = User::factory()->create();
        GithubSponsorship::create([
            'github_sponsor_id' => '9', 'github_login' => 'x', 'user_id' => $user->id,
            'kind' => GithubSponsorship::KIND_MONTHLY, 'status' => GithubSponsorship::STATUS_ACTIVE,
            'source' => GithubSponsorship::SOURCE_WEBHOOK, 'monthly_price_cents' => 500, 'started_at' => now(),
        ]);

        return $user;
    }

    public function test_guest_sees_index(): void
    {
        $this->get('/roadmaps')->assertOk()->assertInertia(fn ($page) => $page
            ->component('Roadmaps/Index')
            ->where('roadmaps.0.slug', 'internet-networking')
            ->where('roadmaps.0.loveCount', 0)
            ->where('mine', [])
            ->has('seo.title'));
    }

    public function test_guest_sees_beginner_fully_and_paid_stages_locked(): void
    {
        $this->get('/roadmaps/internet-networking')->assertOk()->assertInertia(fn ($page) => $page
            ->component('Roadmaps/Show')
            ->where('hasPaidAccess', false)
            ->where('stages.0.locked', false)
            ->has('stages.0.steps.0.resources')
            ->has('stages.0.steps.0.prompt')
            ->has('stages.0.steps.0.claudeUrl')
            ->has('stages.0.steps.0.chatgptUrl')
            ->has('stages.0.steps.0.searchUrl')
            ->where('stages.1.locked', true)
            ->has('stages.1.steps.0.title')
            ->has('stages.1.steps.0.summary')
            ->missing('stages.1.steps.0.resources')
            ->missing('stages.1.steps.0.learn')
            ->missing('stages.1.steps.0.prompt')
            ->missing('stages.1.steps.0.searchUrl')
            ->missing('stages.2.steps.0.resources')
            ->has('seo.title'));
    }

    public function test_locked_resources_are_not_in_the_html(): void
    {
        $this->get('/roadmaps/internet-networking')->assertDontSee('rfc4271', false);
    }

    public function test_sponsor_sees_paid_stages(): void
    {
        $this->actingAs($this->sponsorUser())->get('/roadmaps/internet-networking')->assertInertia(fn ($page) => $page
            ->where('hasPaidAccess', true)
            ->where('stages.1.locked', false)
            ->has('stages.1.steps.0.resources')
            ->has('stages.2.steps.0.prompt'));
    }

    public function test_builds_on_is_shown(): void
    {
        $this->get('/roadmaps/mlops')->assertOk()->assertInertia(fn ($page) => $page
            ->where('roadmap.buildsOn.slug', 'devops')
            ->where('roadmap.buildsOn.title', 'DevOps'));
        $this->get('/roadmaps/devops')->assertInertia(fn ($page) => $page->where('roadmap.buildsOn', null));
        $this->get('/roadmaps')->assertInertia(fn ($page) => $page->has('roadmaps', 5));
    }

    public function test_views_are_counted_and_shown(): void
    {
        $this->get('/roadmaps/aws')->assertInertia(fn ($page) => $page->where('viewCount', 0));

        $this->postJson('/roadmaps/aws/view')->assertOk()->assertJson(['views' => 1]);
        $this->postJson('/roadmaps/aws/view')->assertOk()->assertJson(['views' => 2]);
        $this->postJson('/roadmaps/nope/view')->assertNotFound();

        $this->get('/roadmaps/aws')->assertInertia(fn ($page) => $page->where('viewCount', 2));
        $this->get('/roadmaps')->assertInertia(fn ($page) => $page
            ->where('roadmaps.1.slug', 'aws')
            ->where('roadmaps.1.viewCount', 2)
            ->where('roadmaps.0.viewCount', 0));
    }

    public function test_unknown_roadmap_is_404(): void
    {
        $this->get('/roadmaps/nope')->assertNotFound();
    }

    public function test_unknown_progress_rows_are_ignored(): void
    {
        $user = User::factory()->create();
        RoadmapStart::create(['user_id' => $user->id, 'roadmap_slug' => 'internet-networking']);
        RoadmapProgress::create(['user_id' => $user->id, 'roadmap_slug' => 'internet-networking', 'step_id' => 'gone', 'completed_at' => now()]);
        RoadmapProgress::create(['user_id' => $user->id, 'roadmap_slug' => 'internet-networking', 'step_id' => 'what-is-a-network', 'completed_at' => now()]);
        // A paid step ticked while sponsoring must not count once access ends.
        RoadmapProgress::create(['user_id' => $user->id, 'roadmap_slug' => 'internet-networking', 'step_id' => 'bgp', 'completed_at' => now()]);

        $this->actingAs($user)->get('/roadmaps/internet-networking')->assertOk()->assertInertia(fn ($page) => $page
            ->where('started', true)
            ->where('stages.0.steps.0.done', true)
            ->where('percent', 13)); // 1 of 8 beginner topics

        $this->actingAs($user)->get('/roadmaps')->assertInertia(fn ($page) => $page
            ->where('mine.0.slug', 'internet-networking')
            ->where('mine.0.percent', 13)
            ->where('mine.0.continueStepId', 'ip-addresses'));
    }

    public function test_sitemap_lists_roadmaps(): void
    {
        $this->get('/sitemap.xml')->assertOk()
            ->assertSee(url('/roadmaps'), false)
            ->assertSee(url('/roadmaps/internet-networking'), false);
    }
}
