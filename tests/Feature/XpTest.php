<?php

namespace Tests\Feature;

use App\Models\RoadmapCommentThread;
use App\Models\RoadmapProgress;
use App\Models\Subscriber;
use App\Models\User;
use App\Models\XpAward;
use App\Support\Xp;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class XpTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Carbon::setTestNow('2026-11-18 12:00:00'); // a Wednesday
    }

    public function test_award_is_once_per_key(): void
    {
        $user = User::factory()->create();
        XpAward::query()->delete();

        $this->assertTrue(Xp::award($user, 'lesson:aws/x', 10));
        $this->assertFalse(Xp::award($user, 'lesson:aws/x', 10));
        $this->assertSame(1, XpAward::where('user_id', $user->id)->count());
    }

    public function test_board_periods_and_exclusions(): void
    {
        [$a, $b, $hidden, $admin] = User::factory()->count(4)->create();
        $hidden->forceFill(['leaderboard_hidden' => true])->save();
        $admin->forceFill(['role' => 'admin'])->save();
        XpAward::query()->delete();

        Xp::award($a, 'old', 100, null, Carbon::parse('2026-10-20'));      // last month
        Xp::award($a, 'month', 10, null, Carbon::parse('2026-11-03'));     // this month, last week
        Xp::award($b, 'week', 30, null, Carbon::parse('2026-11-17'));      // this week (Mon 16th start)
        Xp::award($hidden, 'week', 500, null, Carbon::parse('2026-11-17'));
        Xp::award($admin, 'week', 900, null, Carbon::parse('2026-11-17'));

        $this->assertSame([[$a->id, 110], [$b->id, 30]], $this->rows('all'));
        $this->assertSame([[$b->id, 30], [$a->id, 10]], $this->rows('month'));
        $this->assertSame([[$b->id, 30]], $this->rows('week'));
        $this->assertSame(1, Xp::board('week')->first()['rank']);

        $this->assertSame(['rank' => 1, 'xp' => 500], Xp::rankOf($hidden, 'week'));
        $this->assertSame(['rank' => 2, 'xp' => 10], Xp::rankOf($a, 'month'));
        $this->assertNull(Xp::rankOf($a, 'week'));

        Xp::award($a, 'today', 1, null, now());
        $this->assertSame([[$a->id, 1]], $this->rows('day'));
    }

    public function test_backfill_awards_past_activity_once(): void
    {
        $user = User::factory()->create(['created_at' => '2026-01-01']);
        Subscriber::subscribeVerified($user->email, 'footer');
        foreach (['why-packets', 'headers-and-payload', 'mtu', 'dhcp', 'gone-lesson'] as $lesson) {
            RoadmapProgress::create(['user_id' => $user->id, 'roadmap_slug' => 'internet-networking', 'step_id' => $lesson, 'completed_at' => '2026-02-01']);
        }
        $thread = RoadmapCommentThread::forKey('internet-networking/packets');
        $first = $thread->comment('one', $user);
        $thread->comment('two', $user);
        $thread->comment('reply', $user, $first);
        DB::table('comments')->insert([ // left behind by a pruned account
            'user_id' => 999999, 'commentable_type' => $thread->getMorphClass(), 'commentable_id' => $thread->id,
            'content' => 'orphan', 'created_at' => now(), 'updated_at' => now(),
        ]);
        XpAward::query()->delete();

        $migration = require database_path('migrations/2026_11_16_120000_backfill_xp_awards.php');
        $migration->up();
        $migration->up();

        // signup 50 + newsletter 25 + 3 required lessons 30 + packets topic 25 + comment 5 + reply 3
        $this->assertSame(138, (int) XpAward::where('user_id', $user->id)->sum('points'));
        $this->assertSame('2026-01-01', XpAward::where('key', 'signup')->first()->created_at->toDateString());
        $this->assertSame($first->id, XpAward::where('key', 'comment:roadmap/internet-networking/packets')->value('comment_id'));
    }

    private function rows(string $period): array
    {
        return Xp::board($period)->map(fn ($r) => [$r['user_id'], $r['xp']])->all();
    }
}
