<?php

namespace Tests\Feature;

use App\Mail\WeeklyNewsletterMail;
use App\Support\NewsletterIssue;
use App\Support\RoadmapRepository;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class RoadmapNewsletterTest extends TestCase
{
    use RefreshDatabase;

    public function test_recent_roadmaps_are_those_updated_in_the_last_seven_days(): void
    {
        $repo = new RoadmapRepository;
        $aws = Carbon::parse($repo->find('aws')['updated']);
        $issue = app(NewsletterIssue::class);

        $this->assertContains('aws', $issue->recentRoadmaps($aws->copy()->addDays(3))->pluck('slug')->all());
        $this->assertNotContains('aws', $issue->recentRoadmaps($aws->copy()->addDays(8))->pluck('slug')->all());

        $first = $issue->recentRoadmaps($aws->copy()->addDay())->first();
        $this->assertSame(url('/roadmaps/'.$first['slug']), $first['url']);
        $this->assertArrayHasKey('summary', $first);
    }

    public function test_weekly_email_lists_roadmap_updates(): void
    {
        $roadmaps = [['slug' => 'aws', 'title' => 'AWS Cloud', 'summary' => 'Learn AWS.', 'url' => url('/roadmaps/aws')]];
        $mail = new WeeklyNewsletterMail(posts: [], subscriber: null, products: [], roadmaps: $roadmaps);

        $html = $mail->render();
        $this->assertStringContainsString('Roadmap updates', $html);
        $this->assertStringContainsString('AWS Cloud', $html);

        $empty = (new WeeklyNewsletterMail(posts: [], subscriber: null, products: [], roadmaps: []))->render();
        $this->assertStringNotContainsString('Roadmap updates', $empty);
    }
}
