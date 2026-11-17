<?php

namespace Tests\Feature;

use App\Mail\RoadmapProgressMail;
use App\Models\RoadmapProgress;
use App\Models\Subscriber;
use App\Models\User;
use App\Models\XpAward;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class RoadmapProgressEmailTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Carbon::setTestNow('2026-11-21 15:00:00'); // a Saturday
        Mail::fake();
    }

    private function learner(bool $subscribed = true, ?Carbon $doneAt = null): User
    {
        $user = User::factory()->create(['email' => 'learner@example.com', 'email_verified_at' => now()]);
        if ($subscribed) {
            Subscriber::factory()->create(['email' => 'LEARNER@example.com', 'status' => 'subscribed']);
        }
        RoadmapProgress::create(['user_id' => $user->id, 'roadmap_slug' => 'internet-networking', 'step_id' => 'lan-vs-wan', 'completed_at' => $doneAt ?? now()->subDay()]);
        XpAward::query()->where('user_id', $user->id)->delete();
        XpAward::create(['user_id' => $user->id, 'key' => 'lesson:internet-networking/lan-vs-wan', 'points' => 10, 'created_at' => $doneAt ?? now()->subDay()]);

        return $user;
    }

    public function test_subscribed_learner_gets_one_email_with_progress_and_next_lesson(): void
    {
        $this->learner();

        $this->artisan('roadmaps:send-progress')->assertSuccessful();
        $this->artisan('roadmaps:send-progress')->assertSuccessful(); // a rerun must not double-send

        Mail::assertSent(RoadmapProgressMail::class, 1);
        Mail::assertSent(RoadmapProgressMail::class, function (RoadmapProgressMail $m) {
            $html = $m->render();
            $this->assertSame('learner@example.com', strtolower($m->to[0]['address']));
            $this->assertStringContainsString('1 lesson', $m->build()->subject);
            $this->assertStringContainsString('10 XP', $html);
            $this->assertStringContainsString('How the Internet Works', $html);
            $this->assertStringContainsString('/newsletter/unsubscribe/', $html);
            $this->assertMatchesRegularExpression('#/roadmaps/internet-networking/[a-z0-9-]+/[a-z0-9-]+#', $html);

            return true;
        });
    }

    public function test_non_subscribers_and_unsubscribed_get_nothing(): void
    {
        $this->learner(subscribed: false);
        $other = User::factory()->create(['email' => 'gone@example.com', 'email_verified_at' => now()]);
        Subscriber::factory()->create(['email' => 'gone@example.com', 'status' => 'unsubscribed']);
        RoadmapProgress::create(['user_id' => $other->id, 'roadmap_slug' => 'internet-networking', 'step_id' => 'lan-vs-wan', 'completed_at' => now()]);

        $this->artisan('roadmaps:send-progress')->assertSuccessful();

        Mail::assertNothingSent();
    }

    public function test_idle_learner_gets_a_nudge_for_a_month_then_silence(): void
    {
        $this->learner(doneAt: now()->subDays(12));
        $this->artisan('roadmaps:send-progress')->assertSuccessful();
        Mail::assertSent(RoadmapProgressMail::class, fn (RoadmapProgressMail $m) => $m->digest['idle'] && str_contains($m->build()->subject, 'Pick up'));

        Mail::fake();
        $this->travel(5)->weeks(); // 12 days idle, then five more weeks
        $this->artisan('roadmaps:send-progress')->assertSuccessful();
        Mail::assertNothingSent();
    }

    public function test_dry_run_sends_and_records_nothing(): void
    {
        $user = $this->learner();

        $this->artisan('roadmaps:send-progress --dry-run')->expectsOutputToContain("Would send to user #{$user->id}")->assertSuccessful();

        Mail::assertNothingSent();
        $this->assertDatabaseCount('roadmap_digest_sends', 0);
    }
}
