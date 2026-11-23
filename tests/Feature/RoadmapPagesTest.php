<?php

namespace Tests\Feature;

use App\Http\Controllers\Auth\AgreementController;
use App\Models\GithubSponsorship;
use App\Models\RoadmapProgress;
use App\Models\RoadmapStart;
use App\Models\Subscriber;
use App\Models\User;
use App\Support\RoadmapRepository;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RoadmapPagesTest extends TestCase
{
    use RefreshDatabase;

    private const R = 'internet-networking';

    /** A roadmap with sponsor-only levels; How the Internet Works is fully free. */
    private const P = 'networking';

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

    /** @return array{0: array, 1: array} first topic of a stage, and its first required lesson */
    private function topicOf(string $level, string $slug = self::R): array
    {
        $roadmap = (new RoadmapRepository)->find($slug);
        $stage = collect($roadmap['stages'])->firstWhere('level', $level);
        $topic = $stage['topics'][0];

        return [$topic, collect($topic['lessons'])->firstWhere('optional', false)];
    }

    public function test_guest_sees_index(): void
    {
        $this->get('/roadmaps')->assertOk()->assertInertia(fn ($page) => $page
            ->component('Roadmaps/Index')
            ->where('roadmaps.0.slug', self::R)
            ->where('roadmaps.0.loveCount', 0)
            ->has('roadmaps.0.topicCount')
            ->has('roadmaps.0.lessonCount')
            ->where('mine', [])
            ->has('seo.title'));
    }

    public function test_every_roadmap_has_a_known_category(): void
    {
        foreach ((new RoadmapRepository)->all() as $roadmap) {
            $this->assertArrayHasKey($roadmap['category'] ?? '', RoadmapRepository::CATEGORIES, $roadmap['slug']);
        }
        $this->get('/roadmaps')->assertInertia(fn ($page) => $page->has('categories.foundations')->where('roadmaps.0.category', 'foundations'));
    }

    public function test_roadmap_page_lists_topics_with_counts(): void
    {
        $this->get('/roadmaps/'.self::P)->assertOk()->assertInertia(fn ($page) => $page
            ->component('Roadmaps/Show')
            ->where('stages.0.locked', false)
            ->where('stages.1.locked', true)
            ->has('stages.0.topics.0.id')
            ->has('stages.0.topics.0.lessonCount')
            ->where('stages.0.topics.0.doneCount', 0)
            ->missing('stages.0.topics.0.lessons')
            ->where('nextTopicId', null)
            ->has('roadmap.updatedAt')
            ->has('seo.title'));

        // How the Internet Works is free at every level, and has no Advanced stage.
        $this->get('/roadmaps/'.self::R)->assertInertia(fn ($page) => $page
            ->where('stages.0.locked', false)
            ->where('stages.1.locked', false)
            ->where('stages.1.level', 'intermediate')
            ->missing('stages.2')
            ->where('roadmap.free', true));
        $this->get('/roadmaps')->assertInertia(fn ($page) => $page->where('roadmaps.0.slug', self::R)->where('roadmaps.0.free', true)->where('roadmaps.1.free', false));
    }

    public function test_guest_topic_page_hides_ai_prompt_but_shows_resources(): void
    {
        [$topic] = $this->topicOf('beginner');

        $this->get('/roadmaps/'.self::R.'/'.$topic['id'])->assertOk()->assertInertia(fn ($page) => $page
            ->component('Roadmaps/Topic')
            ->where('topic.id', $topic['id'])
            ->where('locked', false)
            ->where('hasAccount', false)
            ->has('lessons.0.resources')
            ->has('lessons.0.searchUrl')
            ->has('lessons.0.optional')
            ->missing('lessons.0.prompt')
            ->missing('lessons.0.claudeUrl')
            ->has('seo.title'));
    }

    public function test_signed_in_reader_gets_the_ai_prompt(): void
    {
        [$topic] = $this->topicOf('beginner');

        $this->actingAs(User::factory()->create())->get('/roadmaps/'.self::R.'/'.$topic['id'])->assertInertia(fn ($page) => $page
            ->has('lessons.0.learn')
            ->has('lessons.0.summary')
            ->has('lessons.0.prompt')
            ->where('lessons.0.prompt', fn ($prompt) => str_contains($prompt, '/roadmaps/'.self::R.' ') && str_contains($prompt, '/roadmaps/'.self::R.'/'.$topic['id'].'/')));
    }

    public function test_paid_topic_and_lesson_redirect_to_the_unlock_box(): void
    {
        [$topic, $lesson] = $this->topicOf('intermediate', self::P);
        $unlock = '/roadmaps/'.self::P.'#unlock';

        $this->get('/roadmaps/'.self::P.'/'.$topic['id'])->assertRedirect($unlock);
        $this->actingAs(User::factory()->create())->get('/roadmaps/'.self::P.'/'.$topic['id'])->assertRedirect($unlock);
        $this->get('/roadmaps/'.self::P.'/'.$topic['id'].'/'.$lesson['id'])->assertRedirect($unlock);
    }

    public function test_sitemap_lists_only_free_topics(): void
    {
        [$free] = $this->topicOf('beginner');
        [$paid] = $this->topicOf('advanced', self::P);

        $this->get('/sitemap.xml')->assertOk()->assertSee('/'.self::R.'/'.$free['id'], false)->assertDontSee('/'.self::P.'/'.$paid['id'].'<', false);
    }

    public function test_sponsor_sees_paid_topics(): void
    {
        [$topic] = $this->topicOf('advanced', self::P);

        $this->actingAs($this->sponsorUser())->get('/roadmaps/'.self::P.'/'.$topic['id'])->assertInertia(fn ($page) => $page
            ->where('locked', false)
            ->has('lessons.0.resources')
            ->has('lessons.0.prompt'));
        $this->actingAs($this->sponsorUser())->get('/roadmaps/'.self::P)->assertInertia(fn ($page) => $page
            ->where('hasPaidAccess', true)
            ->where('stages.1.locked', false));
    }

    public function test_builds_on_is_shown(): void
    {
        $this->get('/roadmaps/mlops')->assertOk()->assertInertia(fn ($page) => $page
            ->where('roadmap.prerequisites.0.slug', 'devops')
            ->where('roadmap.prerequisites.0.title', 'DevOps')
            ->where('roadmap.successors', []));
        $this->get('/roadmaps/devops')->assertInertia(fn ($page) => $page
            ->where('roadmap.prerequisites.0.slug', 'networking')
            ->where('roadmap.successors.0.slug', 'sre'));
        $this->get('/roadmaps/internet-networking')->assertInertia(fn ($page) => $page
            ->where('roadmap.prerequisites', [])
            ->where('roadmap.successors.0.slug', 'networking'));
    }

    public function test_views_are_counted_and_shown(): void
    {
        $this->get('/roadmaps/aws')->assertInertia(fn ($page) => $page->where('viewCount', 0));

        $this->postJson('/roadmaps/aws/view')->assertOk()->assertJson(['views' => 1]);
        $this->postJson('/roadmaps/aws/view')->assertOk()->assertJson(['views' => 2]);
        $this->postJson('/roadmaps/nope/view')->assertNotFound();

        $this->get('/roadmaps/aws')->assertInertia(fn ($page) => $page->where('viewCount', 2));
        $this->get('/roadmaps')->assertInertia(fn ($page) => $page
            ->where('roadmaps.2.slug', 'aws') // after How the Internet Works and Networking
            ->where('roadmaps.2.viewCount', 2)
            ->where('roadmaps.0.viewCount', 0));

        // Topic and lesson views add to the roadmap's total.
        $roadmap = app(RoadmapRepository::class)->find('aws');
        $topic = $roadmap['stages'][0]['topics'][0];
        $this->postJson('/roadmaps/aws/view', ['topic' => $topic['id']])->assertOk()->assertJson(['views' => 3]);
        $this->postJson('/roadmaps/aws/view', ['topic' => $topic['id'], 'lesson' => $topic['lessons'][0]['id']])->assertOk()->assertJson(['views' => 4]);
        $this->postJson('/roadmaps/aws/view', ['topic' => 'nope'])->assertNotFound();
        $this->postJson('/roadmaps/aws/view', ['topic' => $topic['id'], 'lesson' => 'nope'])->assertNotFound();
        $this->get('/roadmaps/aws')->assertInertia(fn ($page) => $page->where('viewCount', 4)->where('discussionCount', 0));

        RoadmapStart::create(['user_id' => User::factory()->create()->id, 'roadmap_slug' => 'aws']);
        $this->get('/roadmaps/aws')->assertInertia(fn ($page) => $page->where('joinCount', 1));
        $this->get('/roadmaps')->assertInertia(fn ($page) => $page->where('roadmaps.2.joinCount', 1)->where('roadmaps.0.joinCount', 0));
    }

    public function test_unknown_roadmap_or_topic_is_404(): void
    {
        $this->get('/roadmaps/nope')->assertNotFound();
        $this->get('/roadmaps/'.self::R.'/nope')->assertNotFound();
    }

    public function test_progress_counts_required_lessons_and_ignores_unknown_rows(): void
    {
        $user = User::factory()->create();
        [$topic, $lesson] = $this->topicOf('beginner', self::P);
        [, $paidLesson] = $this->topicOf('advanced', self::P);
        $optional = collect((new RoadmapRepository)->lessonIndex((new RoadmapRepository)->find(self::P)))
            ->filter(fn ($l) => $l['optional'] && $l['level'] === 'beginner')->keys()->first();

        RoadmapStart::create(['user_id' => $user->id, 'roadmap_slug' => self::P]);
        foreach (array_filter(['gone', $lesson['id'], $paidLesson['id'], $optional]) as $id) {
            RoadmapProgress::create(['user_id' => $user->id, 'roadmap_slug' => self::P, 'step_id' => $id, 'completed_at' => now()]);
        }

        $required = collect((new RoadmapRepository)->lessonIndex((new RoadmapRepository)->find(self::P)))
            ->filter(fn ($l) => ! $l['optional'] && $l['level'] === 'beginner')->count();
        $expected = (int) round(100 / $required);

        $this->actingAs($user)->get('/roadmaps/'.self::P)->assertOk()->assertInertia(fn ($page) => $page
            ->where('started', true)
            ->where('stages.0.topics.0.doneCount', 1)
            ->where('percent', $expected)
            ->where('nextTopicId', $topic['id']));

        $this->actingAs($user)->get('/roadmaps')->assertInertia(fn ($page) => $page
            ->where('mine.0.slug', self::P)
            ->where('mine.0.percent', $expected));
    }

    public function test_sitemap_lists_roadmaps_and_topics(): void
    {
        [$topic] = $this->topicOf('beginner');

        $this->get('/sitemap.xml')->assertOk()
            ->assertSee(url('/roadmaps'), false)
            ->assertSee(url('/roadmaps/'.self::R), false)
            ->assertSee(url('/roadmaps/'.self::R.'/'.$topic['id']), false);
    }

    public function test_short_links_redirect(): void
    {
        $this->get('/r')->assertRedirect('/roadmaps');
        $this->get('/r/')->assertRedirect('/roadmaps');
        $this->get('/rs')->assertRedirect('/raystack');
        $this->get('/rs/')->assertRedirect('/raystack');
    }

    public function test_starting_a_roadmap_offers_the_newsletter_once_and_never_subscribes_silently(): void
    {
        $user = User::factory()->create(['email_verified_at' => now()]);
        $key = AgreementController::NEWSLETTER_OFFER_KEY;

        $this->actingAs($user)->post('/roadmaps/'.self::R.'/start')->assertSessionHas($key, true);
        $this->assertFalse(Subscriber::isSubscribed($user->email)); // an offer, not an opt-in

        $this->flushSession();
        $this->actingAs($user)->post('/roadmaps/'.self::R.'/start')->assertSessionMissing($key); // already started: no second offer
    }

    public function test_no_offer_for_someone_who_already_gets_the_newsletter(): void
    {
        $user = User::factory()->create(['email_verified_at' => now()]);
        Subscriber::factory()->create(['email' => $user->email, 'status' => 'subscribed']);

        $this->actingAs($user)->post('/roadmaps/'.self::R.'/start')
            ->assertSessionMissing(AgreementController::NEWSLETTER_OFFER_KEY);
    }
}
