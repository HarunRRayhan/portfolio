<?php

namespace Tests\Feature;

use App\Mail\WeeklyNewsletterMail;
use App\Models\NewsletterCampaign;
use App\Models\NewsletterClick;
use App\Models\NewsletterDelivery;
use App\Models\Subscriber;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\URL;
use Tests\TestCase;

class NewsletterTrackingTest extends TestCase
{
    use RefreshDatabase;

    private function delivery(): NewsletterDelivery
    {
        $campaign = NewsletterCampaign::create(['key' => '2026-W43', 'post_slugs' => ['a'], 'subject' => 'Hi', 'subscriber_count' => 1]);

        return NewsletterDelivery::create([
            'newsletter_campaign_id' => $campaign->id,
            'subscriber_id' => Subscriber::factory()->create()->id,
            'status' => NewsletterDelivery::STATUS_SENT,
        ]);
    }

    public function test_subscriber_emails_track_every_link_and_opens_but_owner_copies_do_not(): void
    {
        Carbon::setTestNow('2026-09-29 16:00:00');
        Mail::fake();
        Subscriber::factory()->create();

        $this->artisan('newsletter:send-weekly')->assertSuccessful();

        $mails = Mail::sent(WeeklyNewsletterMail::class);
        $subscriberMail = $mails->first(fn (WeeklyNewsletterMail $mail) => $mail->subscriber !== null);
        $ownerMail = $mails->first(fn (WeeklyNewsletterMail $mail) => $mail->subscriber === null);

        $html = $subscriberMail->render();
        preg_match_all('/href="([^"]+)"/', $html, $links);
        $untracked = array_filter($links[1], fn (string $link) => ! str_contains($link, '/newsletter/c/') && ! str_contains($link, '/newsletter/unsubscribe/'));
        $this->assertSame([], array_values($untracked));
        $this->assertStringContainsString('/newsletter/o/', $html);

        $this->assertStringNotContainsString('/newsletter/c/', $ownerMail->render());
        $this->assertStringNotContainsString('/newsletter/o/', $ownerMail->render());
        Carbon::setTestNow();
    }

    public function test_the_open_pixel_marks_the_delivery_opened_once(): void
    {
        $delivery = $this->delivery();
        $url = URL::signedRoute('newsletter.open', ['delivery' => $delivery->id]);

        $this->get($url)->assertOk()->assertHeader('Content-Type', 'image/gif');
        $openedAt = $delivery->fresh()->opened_at;
        $this->assertNotNull($openedAt);

        $this->travel(1)->hours();
        $this->get($url)->assertOk();
        $this->assertTrue($openedAt->equalTo($delivery->fresh()->opened_at));
    }

    public function test_a_click_is_recorded_counts_as_an_open_and_redirects(): void
    {
        $delivery = $this->delivery();
        $url = URL::signedRoute('newsletter.click', ['delivery' => $delivery->id, 'url' => 'https://harun.dev/blog/x?a=1&b=2']);

        $this->get($url)->assertRedirect('https://harun.dev/blog/x?a=1&b=2');

        $this->assertDatabaseHas('newsletter_clicks', ['newsletter_delivery_id' => $delivery->id, 'url' => 'https://harun.dev/blog/x?a=1&b=2']);
        $this->assertNotNull($delivery->fresh()->opened_at);
    }

    public function test_a_tampered_click_link_does_not_redirect(): void
    {
        $delivery = $this->delivery();
        $url = URL::signedRoute('newsletter.click', ['delivery' => $delivery->id, 'url' => 'https://harun.dev/blog']);

        $this->get(str_replace(urlencode('https://harun.dev/blog'), urlencode('https://evil.example'), $url))->assertForbidden();
        $this->assertDatabaseCount('newsletter_clicks', 0);
    }

    public function test_campaigns_report_opens_clicks_and_per_link_counts(): void
    {
        $delivery = $this->delivery();
        $delivery->update(['opened_at' => now()]);
        foreach (['https://a.test', 'https://a.test', 'https://b.test'] as $link) {
            NewsletterClick::create(['newsletter_delivery_id' => $delivery->id, 'url' => $link]);
        }

        $admin = User::factory()->create(['email_verified_at' => now(), 'role' => 'admin']);
        $response = $this->actingAs($admin)->get('/admin/newsletter/campaigns', $this->inertiaHeaders());

        $response->assertJsonPath('props.campaigns.data.0.opened_count', 1)
            ->assertJsonPath('props.campaigns.data.0.click_count', 3)
            ->assertJsonPath('props.campaigns.data.0.clicker_count', 1)
            ->assertJsonPath('props.campaigns.data.0.links.0', ['url' => 'https://a.test', 'clicks' => 2, 'people' => 1]);
    }
}
