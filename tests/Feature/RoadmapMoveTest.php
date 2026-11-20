<?php

namespace Tests\Feature;

use App\Models\RoadmapCommentThread;
use App\Models\RoadmapProgress;
use App\Models\User;
use App\Models\XpAward;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class RoadmapMoveTest extends TestCase
{
    use RefreshDatabase;

    public function test_old_urls_of_moved_lessons_and_topics_redirect(): void
    {
        $this->get('/roadmaps/internet-networking/ipv4/ipv4-broadcast')->assertRedirect('/roadmaps/networking/ipv4-in-depth/ipv4-broadcast')->assertStatus(301);
        $this->get('/roadmaps/internet-networking/nat/source-nat')->assertRedirect('/roadmaps/networking/nat/source-nat');
        $this->get('/roadmaps/internet-networking/nat')->assertRedirect('/roadmaps/networking/nat')->assertStatus(301);
        $this->get('/roadmaps/internet-networking/ipv4/nope')->assertNotFound();
        $this->get('/roadmaps/internet-networking/nope')->assertNotFound();
        $this->get('/roadmaps/internet-networking/ipv4/ipv4-format')->assertOk();
    }

    public function test_migration_carries_progress_xp_and_comments_to_networking(): void
    {
        $user = User::factory()->create();
        RoadmapProgress::create(['user_id' => $user->id, 'roadmap_slug' => 'internet-networking', 'step_id' => 'ipv4-broadcast', 'completed_at' => now()]);
        RoadmapProgress::create(['user_id' => $user->id, 'roadmap_slug' => 'internet-networking', 'step_id' => 'lan-vs-wan', 'completed_at' => now()]);
        XpAward::create(['user_id' => $user->id, 'key' => 'lesson:internet-networking/ipv4-broadcast', 'points' => 10]);
        XpAward::create(['user_id' => $user->id, 'key' => 'topic:internet-networking/nat', 'points' => 50]);
        RoadmapCommentThread::forKey('internet-networking/ipv4/ipv4-broadcast');

        $migration = require database_path('migrations/2026_11_20_120000_move_technical_lessons_to_networking.php');
        $migration->up();

        $this->assertSame(['networking'], RoadmapProgress::where('step_id', 'ipv4-broadcast')->pluck('roadmap_slug')->all());
        $this->assertSame(['internet-networking'], RoadmapProgress::where('step_id', 'lan-vs-wan')->pluck('roadmap_slug')->all());
        $this->assertTrue(DB::table('roadmap_starts')->where(['user_id' => $user->id, 'roadmap_slug' => 'networking'])->exists());
        $this->assertTrue(XpAward::where('key', 'lesson:networking/ipv4-broadcast')->exists());
        $this->assertTrue(XpAward::where('key', 'topic:networking/nat')->exists());
        $this->assertNotNull(RoadmapCommentThread::findKey('networking/ipv4-in-depth/ipv4-broadcast'));

        $migration->down();
        $this->assertSame(['internet-networking'], RoadmapProgress::where('step_id', 'ipv4-broadcast')->pluck('roadmap_slug')->all());
        $this->assertNotNull(RoadmapCommentThread::findKey('internet-networking/ipv4/ipv4-broadcast'));
    }
}
