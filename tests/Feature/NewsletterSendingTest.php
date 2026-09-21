<?php

namespace Tests\Feature;

use App\Mail\WeeklyNewsletterMail;
use App\Models\NewsletterCampaign;
use App\Models\Subscriber;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\URL;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class NewsletterSendingTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config(['newsletter.enabled' => true]);
        Carbon::setTestNow('2026-09-21 09:00:00');
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    #[Test]
    public function the_weekly_command_sends_only_to_active_subscribers(): void
    {
        Mail::fake();
        $subscriber = Subscriber::factory()->create();
        Subscriber::factory()->create(['status' => 'unsubscribed']);

        $this->artisan('newsletter:send-weekly')
            ->assertSuccessful();

        Mail::assertSent(WeeklyNewsletterMail::class, 1);
        Mail::assertSent(
            WeeklyNewsletterMail::class,
            fn (WeeklyNewsletterMail $mail): bool => $mail->subscriber->is($subscriber)
                && $mail->subscriberCount === 1
                && $mail->posts !== [],
        );
        $this->assertNotNull(NewsletterCampaign::query()->firstOrFail()->sent_at);
        $this->assertDatabaseCount('newsletter_deliveries', 1);
    }

    #[Test]
    public function a_weekly_campaign_is_not_sent_twice(): void
    {
        Mail::fake();
        Subscriber::factory()->create();

        $this->artisan('newsletter:send-weekly')->assertSuccessful();
        $this->artisan('newsletter:send-weekly')->assertSuccessful();

        Mail::assertSent(WeeklyNewsletterMail::class, 1);
        $this->assertDatabaseCount('newsletter_campaigns', 1);
        $this->assertDatabaseCount('newsletter_deliveries', 1);
    }

    #[Test]
    public function an_email_unsubscribe_link_deactivates_the_subscriber(): void
    {
        $subscriber = Subscriber::factory()->create();
        $url = URL::signedRoute('newsletter.unsubscribe', ['subscriber' => $subscriber]);

        $this->get($url)->assertOk();

        $this->assertDatabaseHas('subscribers', [
            'id' => $subscriber->id,
            'status' => 'unsubscribed',
        ]);
    }

    #[Test]
    public function the_newsletter_email_contains_the_reader_count_and_unsubscribe_link(): void
    {
        $subscriber = Subscriber::factory()->create();
        $mail = new WeeklyNewsletterMail([
            [
                'title' => 'A useful post',
                'brief' => 'A short summary for the email.',
                'canonicalUrl' => 'https://harun.dev/blog/a-useful-post',
                'coverImageUrl' => null,
                'publishedAtHuman' => 'Sep 21, 2026',
                'readTimeLabel' => '4 min read',
            ],
        ], $subscriber, 5);

        $html = $mail->render();

        $this->assertStringContainsString('You’re one of 5 readers', $html);
        $this->assertStringContainsString('/newsletter/unsubscribe/'.$subscriber->id, $html);
        $this->assertStringContainsString('A useful post', $html);
    }
}
