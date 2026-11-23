<?php

namespace Tests\Feature;

use App\Models\RoadmapAccessGrant;
use App\Models\RoadmapProgress;
use App\Models\RoadmapReaction;
use App\Models\RoadmapStart;
use App\Models\User;
use App\Support\RoadmapRepository;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RoadmapActionsTest extends TestCase
{
    use RefreshDatabase;

    private const R = '/roadmaps/internet-networking';

    private function lessonAt(string $level, string $slug = 'internet-networking'): string
    {
        $repo = new RoadmapRepository;

        return collect($repo->lessonIndex($repo->find($slug)))->filter(fn ($l) => $l['level'] === $level)->keys()->first();
    }

    public function test_guests_are_sent_to_login(): void
    {
        $this->post(self::R.'/start')->assertRedirect('/login');
        $this->post(self::R.'/love')->assertRedirect('/login');
        $this->post(self::R.'/lessons/'.$this->lessonAt('beginner'))->assertRedirect('/login');
    }

    public function test_start_is_idempotent(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user)->post(self::R.'/start')->assertRedirect();
        $this->actingAs($user)->post(self::R.'/start')->assertRedirect();

        $this->assertSame(1, RoadmapStart::where('user_id', $user->id)->count());
    }

    public function test_tick_and_untick_a_free_topic(): void
    {
        $user = User::factory()->create();
        $lesson = $this->lessonAt('beginner');
        $this->actingAs($user)->post(self::R.'/lessons/'.$lesson)->assertRedirect();
        $this->actingAs($user)->post(self::R.'/lessons/'.$lesson)->assertRedirect();

        $this->assertSame(1, RoadmapProgress::where('user_id', $user->id)->count());
        $this->assertTrue(RoadmapStart::where('user_id', $user->id)->exists());

        $this->actingAs($user)->delete(self::R.'/lessons/'.$lesson)->assertRedirect();
        $this->assertSame(0, RoadmapProgress::where('user_id', $user->id)->count());
    }

    public function test_paid_topic_needs_access(): void
    {
        $user = User::factory()->create(['email' => 'a@b.com']);
        $this->actingAs($user)->post('/roadmaps/networking/lessons/'.$this->lessonAt('advanced', 'networking'))->assertForbidden();
        $this->assertSame(0, RoadmapProgress::count());

        // How the Internet Works is free at every level.
        $this->actingAs($user)->post(self::R.'/lessons/'.$this->lessonAt('intermediate'))->assertRedirect();
        $this->assertSame(1, RoadmapProgress::count());

        RoadmapAccessGrant::create(['email' => 'a@b.com', 'expires_at' => now()->addWeek()]);
        $this->actingAs($user)->post('/roadmaps/networking/lessons/'.$this->lessonAt('advanced', 'networking'))->assertRedirect();
        $this->assertSame(2, RoadmapProgress::count());
    }

    public function test_unknown_roadmap_or_step_is_404(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user)->post('/roadmaps/nope/start')->assertNotFound();
        $this->actingAs($user)->post(self::R.'/lessons/nope')->assertNotFound();
    }

    public function test_love_toggles_and_counts(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user)->post(self::R.'/love')->assertRedirect();
        $this->actingAs($user)->get(self::R)->assertInertia(fn ($p) => $p->where('loved', true)->where('loveCount', 1));

        $this->actingAs($user)->post(self::R.'/love')->assertRedirect();
        $this->actingAs($user)->get(self::R)->assertInertia(fn ($p) => $p->where('loved', false)->where('loveCount', 0));
    }

    public function test_wishlist_toggles_and_shows_in_index(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user)->post(self::R.'/wishlist')->assertRedirect();

        $this->assertSame(1, RoadmapReaction::where('type', RoadmapReaction::WISHLIST)->count());
        $this->actingAs($user)->get('/roadmaps')->assertInertia(fn ($p) => $p
            ->where('mine.0.saved', true)
            ->where('mine.0.started', false));

        $this->actingAs($user)->post(self::R.'/wishlist')->assertRedirect();
        $this->assertSame(0, RoadmapReaction::count());
    }
}
