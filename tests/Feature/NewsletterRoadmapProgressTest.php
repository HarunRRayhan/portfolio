<?php

namespace Tests\Feature;

use App\Mail\WeeklyNewsletterMail;
use App\Models\RoadmapProgress;
use App\Models\Subscriber;
use App\Models\User;
use App\Models\XpAward;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

/** The roadmap progress digest rides inside the weekly newsletter; there is no separate roadmap email. */
class NewsletterRoadmapProgressTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Carbon::setTestNow('2026-11-21 15:00:00');
    }

    private function learner(?Carbon $doneAt = null): Subscriber
    {
        $user = User::factory()->create(['email' => 'learner@example.com', 'email_verified_at' => now()]);
        RoadmapProgress::create(['user_id' => $user->id, 'roadmap_slug' => 'internet-networking', 'step_id' => 'lan-vs-wan', 'completed_at' => $doneAt ?? now()->subDay()]);
        XpAward::query()->where('user_id', $user->id)->delete();
        XpAward::create(['user_id' => $user->id, 'key' => 'lesson:internet-networking/lan-vs-wan', 'points' => 10, 'created_at' => $doneAt ?? now()->subDay()]);

        return Subscriber::factory()->create(['email' => 'LEARNER@example.com', 'status' => 'subscribed']);
    }

    private function render(?Subscriber $subscriber): string
    {
        return (new WeeklyNewsletterMail([], $subscriber, [], roadmaps: []))->render();
    }

    public function test_a_learning_subscriber_gets_progress_and_next_lesson_in_the_newsletter(): void
    {
        $html = $this->render($this->learner());

        $this->assertStringContainsString('Your roadmap week', $html);
        $this->assertStringContainsString('You finished 1 lesson', $html);
        $this->assertStringContainsString('How the Internet Works', $html);
        $this->assertMatchesRegularExpression('#/roadmaps/internet-networking/[a-z0-9-]+/[a-z0-9-]+#', $html);
        $this->assertStringNotContainsString('Start a roadmap', $html);
    }

    public function test_a_subscriber_without_a_roadmap_is_invited_to_start_one(): void
    {
        $html = $this->render(Subscriber::factory()->create());

        $this->assertStringContainsString('Start a roadmap', $html);
        $this->assertStringContainsString('/roadmaps', $html);
        $this->assertStringNotContainsString('XP in total', $html);
    }

    public function test_an_idle_learner_gets_a_nudge_for_a_month_then_the_invite(): void
    {
        $subscriber = $this->learner(doneAt: now()->subDays(12));
        $this->assertStringContainsString('Pick up where you stopped', $this->render($subscriber));

        $this->travel(5)->weeks();
        $this->assertStringContainsString('Start a roadmap', $this->render($subscriber));
    }
}
