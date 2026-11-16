<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class LeaderboardPageTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_sees_board_and_bad_period_falls_back_to_week(): void
    {
        $user = User::factory()->create(['name' => 'Ada']);

        $this->get('/leaderboard?period=forever')->assertOk()->assertInertia(fn (Assert $p) => $p
            ->component('Leaderboard')->where('period', 'week')->where('me', null)
            ->where('rows.0.name', 'Ada')->where('rows.0.xp', 50));
    }

    public function test_hiding_removes_user_from_rows_but_keeps_own_rank(): void
    {
        $user = User::factory()->create(['terms_accepted_at' => now()]);
        $other = User::factory()->create();

        $this->actingAs($user)->patch('/leaderboard/visibility', ['hidden' => true])->assertRedirect();

        $this->actingAs($user)->get('/leaderboard?period=all')->assertInertia(fn (Assert $p) => $p
            ->where('hidden', true)->has('rows', 1)->where('rows.0.user_id', $other->id)
            ->where('me', ['rank' => 1, 'xp' => 50]));
    }

    public function test_own_total_is_shared_for_the_nav(): void
    {
        $user = User::factory()->create(['terms_accepted_at' => now()]);
        $this->actingAs($user)->get('/leaderboard')->assertInertia(fn (Assert $p) => $p->where('auth.xp', 50));
        auth()->logout();
        $this->get('/leaderboard')->assertInertia(fn (Assert $p) => $p->where('auth.xp', null));
    }

    public function test_visibility_needs_an_account(): void
    {
        $this->patch('/leaderboard/visibility', ['hidden' => true])->assertRedirect('/login');
    }

    public function test_name_taken_from_email_is_masked(): void
    {
        User::factory()->create(['name' => 'jane.doe', 'email' => 'Jane.Doe@example.com']);

        $this->get('/leaderboard')->assertInertia(fn (Assert $p) => $p->where('rows.0.name', 'ja•••'))
            ->assertDontSee('jane.doe');
    }
}
