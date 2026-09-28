<?php

namespace Tests\Feature;

use App\Mail\WeeklyNewsletterMail;
use App\Models\NewsletterCampaign;
use App\Models\Subscriber;
use App\Support\BlogRepository;
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
        Carbon::setTestNow('2026-09-29 16:00:00');
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
                && $mail->posts !== []
                && ! empty($mail->posts[0]['newsletterExcerpt']),
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
    public function product_choices_are_distinct_stored_and_change_after_the_previous_campaign(): void
    {
        Mail::fake();
        Subscriber::factory()->create();
        NewsletterCampaign::query()->create([
            'key' => '2026-W39',
            'post_slugs' => ['older-post'],
            'subject' => 'Previous week',
            'products' => array_slice(config('newsletter.products'), 0, 2),
            'sent_at' => Carbon::parse('2026-09-22 16:00:00'),
        ]);

        $this->artisan('newsletter:send-weekly')->assertSuccessful();

        $campaign = NewsletterCampaign::query()->where('key', '2026-W40')->firstOrFail();
        $keys = collect($campaign->products)->pluck('key')->all();
        $this->assertCount(2, $keys);
        $this->assertCount(2, array_unique($keys));
        $this->assertEmpty(array_intersect(['toolblip', 'cloudploy'], $keys));
        Mail::assertSent(
            WeeklyNewsletterMail::class,
            fn (WeeklyNewsletterMail $mail): bool => collect($mail->products)->pluck('key')->all() === $keys,
        );
    }

    #[Test]
    public function a_pending_campaign_is_not_sent_when_its_post_is_older_than_seven_days(): void
    {
        Carbon::setTestNow('2026-10-13 16:00:00');
        Mail::fake();
        Subscriber::factory()->create();
        NewsletterCampaign::query()->create([
            'key' => '2026-W42',
            'post_slugs' => ['mcp-authentication-fix-401-remote-server'],
            'subject' => 'Old post',
        ]);

        $this->artisan('newsletter:send-weekly')->assertSuccessful();

        Mail::assertNothingSent();
        $this->assertDatabaseCount('newsletter_deliveries', 0);
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
    public function a_week_without_a_new_post_does_not_send_or_create_a_campaign(): void
    {
        Carbon::setTestNow('2026-10-13 16:00:00');
        Mail::fake();
        Subscriber::factory()->create();

        $this->artisan('newsletter:send-weekly')->assertSuccessful();

        Mail::assertNothingSent();
        $this->assertDatabaseCount('newsletter_campaigns', 0);
    }

    #[Test]
    public function the_campaign_uses_only_the_three_newest_posts_from_the_last_seven_days(): void
    {
        Mail::fake();
        Subscriber::factory()->create();
        $blog = $this->mock(BlogRepository::class);
        $blog->shouldReceive('indexPosts')->once()->andReturn(collect([
            ['slug' => 'new-1', 'title' => 'New 1', 'publishedAt' => '2026-09-29T12:00:00Z'],
            ['slug' => 'new-2', 'title' => 'New 2', 'publishedAt' => '2026-09-28T12:00:00Z'],
            ['slug' => 'new-3', 'title' => 'New 3', 'publishedAt' => '2026-09-27T12:00:00Z'],
            ['slug' => 'new-4', 'title' => 'New 4', 'publishedAt' => '2026-09-26T12:00:00Z'],
            ['slug' => 'old', 'title' => 'Old', 'publishedAt' => '2026-09-20T12:00:00Z'],
        ])->all());

        $this->artisan('newsletter:send-weekly')->assertSuccessful();

        $this->assertSame(['new-1', 'new-2', 'new-3'], NewsletterCampaign::query()->firstOrFail()->post_slugs);
        Mail::assertSent(WeeklyNewsletterMail::class, fn (WeeklyNewsletterMail $mail): bool => count($mail->posts) === 3);
    }

    #[Test]
    public function the_email_uses_at_most_three_curated_x_posts(): void
    {
        config(['newsletter.tweets' => collect(range(1, 4))
            ->map(fn (int $number): array => [
                'text' => "Post {$number}",
                'url' => "https://x.com/harundotdev/status/{$number}",
            ])
            ->all()]);
        Mail::fake();
        Subscriber::factory()->create();

        $this->artisan('newsletter:send-weekly')->assertSuccessful();

        Mail::assertSent(
            WeeklyNewsletterMail::class,
            fn (WeeklyNewsletterMail $mail): bool => count($mail->tweets) === 3
                && $mail->tweets[2]['text'] === 'Post 3',
        );
    }

    #[Test]
    public function the_newsletter_email_has_product_logos_tweets_and_plain_footer_links(): void
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
        ], $subscriber, [
            ['name' => 'Toolblip', 'url' => 'https://toolblip.com', 'description' => 'Developer tools in your browser.', 'logoUrl' => 'https://harun.dev/images/products/toolblip-email.png'],
            ['name' => 'Crontinel', 'url' => 'https://crontinel.com', 'description' => 'Monitor background jobs.', 'logoUrl' => 'https://harun.dev/images/products/crontinel.png'],
        ], [
            ['text' => 'A note from X about cron jobs.', 'url' => 'https://x.com/harundotdev/status/123'],
        ]);

        $html = $mail->render();

        $this->assertStringNotContainsString('readers getting these notes', $html);
        $this->assertStringContainsString('Toolblip', $html);
        $this->assertStringContainsString('Crontinel', $html);
        $this->assertStringContainsString('https://harun.dev/images/products/toolblip-email.png', $html);
        $this->assertStringContainsString('https://harun.dev/images/products/crontinel.png', $html);
        $this->assertStringContainsString('A note from X about cron jobs.', $html);
        $this->assertStringContainsString('https://harun.dev/images/brand/harun-logo-wordmark-email.png', $html);
        $this->assertTrue(strpos($html, 'harun-logo-wordmark-email.png') < strpos($html, 'class="newsletter"'));
        $this->assertTrue(strpos($html, 'Also building') < strpos($html, 'A note from X about cron jobs.'));
        $this->assertTrue(strpos($html, 'A note from X about cron jobs.') < strpos($html, 'Thanks for reading'));
        $this->assertStringContainsString('Browse the blog', $html);
        $this->assertStringNotContainsString('padding:10px 14px', $html);
        $this->assertStringContainsString('/newsletter/unsubscribe/'.$subscriber->id, $html);
        $this->assertStringContainsString('A useful post', $html);

        $cloudPloy = collect(config('newsletter.products'))->firstWhere('name', 'CloudPloy');
        $this->assertSame('https://harun.dev/images/products/cloudploy-email.png', $cloudPloy['logoUrl']);
        $this->assertFileExists(public_path('images/products/cloudploy-email.png'));
        $this->assertFileExists(public_path('images/products/cloudploy-icon.svg'));

        $withoutTweets = (new WeeklyNewsletterMail($mail->posts, $subscriber, $mail->products))->render();
        $this->assertStringContainsString('https://x.com/harundotdev', $withoutTweets);
        $this->assertStringContainsString('shorter engineering notes', $withoutTweets);
    }
}
