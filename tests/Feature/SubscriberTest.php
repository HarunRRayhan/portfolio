<?php

namespace Tests\Feature;

use App\Http\Middleware\HandleInertiaRequests;
use App\Mail\SubscribeConfirmationMail;
use App\Models\Subscriber;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\URL;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class SubscriberTest extends TestCase
{
    use RefreshDatabase;

    private const FLASH = 'Check your inbox to confirm your subscription.';

    protected function setUp(): void
    {
        parent::setUp();
        Mail::fake();
    }

    #[Test]
    public function it_can_subscribe_with_a_valid_email()
    {
        $response = $this->post('/subscribe', [
            'email' => 'jane@example.com',
            'source' => 'bio',
            'referrer' => 'direct',
        ]);

        $response->assertRedirect();
        $response->assertSessionHas('flash.type', 'success');
        $response->assertSessionHas('flash.message', self::FLASH);

        $this->assertDatabaseHas('subscribers', [
            'email' => 'jane@example.com',
            'source' => 'bio',
            'referrer' => 'direct',
            'status' => 'pending',
        ]);
        $this->assertDatabaseMissing('subscribers', ['status' => 'subscribed']);

        $subscriber = Subscriber::where('email', 'jane@example.com')->first();
        Mail::assertSent(SubscribeConfirmationMail::class, function (SubscribeConfirmationMail $mail) use ($subscriber) {
            return $mail->hasTo('jane@example.com')
                && str_contains($mail->url, '/newsletter/confirm/'.$subscriber->id)
                && str_contains($mail->url, 'signature=');
        });
    }

    #[Test]
    public function a_filled_honeypot_gets_the_same_reply_but_stores_and_mails_nothing()
    {
        $this->post('/subscribe', ['email' => 'bot@example.com', 'website' => 'http://spam.test'])
            ->assertSessionHas('flash.message', self::FLASH);

        $this->assertDatabaseCount('subscribers', 0);
        Mail::assertNothingSent();
    }

    #[Test]
    public function the_signed_confirm_link_subscribes_the_reader()
    {
        $subscriber = Subscriber::create(['email' => 'jane@example.com', 'status' => 'pending']);

        $response = $this->get(URL::signedRoute('newsletter.confirm', ['subscriber' => $subscriber->id]));

        $response->assertRedirect('/blog');
        $response->assertSessionHas('flash.type', 'success');
        $this->assertSame('subscribed', $subscriber->fresh()->status);
    }

    #[Test]
    public function an_unsigned_or_tampered_confirm_link_is_rejected()
    {
        $subscriber = Subscriber::create(['email' => 'jane@example.com', 'status' => 'pending']);
        $other = Subscriber::create(['email' => 'bob@example.com', 'status' => 'pending']);

        $this->get('/newsletter/confirm/'.$subscriber->id)->assertForbidden();

        $tampered = str_replace('/confirm/'.$subscriber->id, '/confirm/'.$other->id, URL::signedRoute('newsletter.confirm', ['subscriber' => $subscriber->id]));
        $this->get($tampered)->assertForbidden();

        $this->assertSame('pending', $subscriber->fresh()->status);
        $this->assertSame('pending', $other->fresh()->status);
    }

    #[Test]
    public function a_confirm_link_older_than_seven_days_is_rejected()
    {
        $this->post('/subscribe', ['email' => 'jane@example.com']);
        $subscriber = Subscriber::where('email', 'jane@example.com')->firstOrFail();
        $url = null;
        Mail::assertSent(SubscribeConfirmationMail::class, function (SubscribeConfirmationMail $mail) use (&$url) {
            $url = $mail->url;

            return true;
        });

        $this->travel(8)->days();

        $this->get($url)->assertForbidden();
        $this->assertSame('pending', $subscriber->fresh()->status);
    }

    #[Test]
    public function the_same_address_in_another_case_reuses_one_row()
    {
        $this->post('/subscribe', ['email' => 'JANE@example.com']);
        $this->post('/subscribe', ['email' => 'jane@example.com']);

        $this->assertDatabaseCount('subscribers', 1);
        $this->assertDatabaseHas('subscribers', ['email' => 'jane@example.com']);
    }

    #[Test]
    public function a_legacy_mixed_case_subscriber_gets_no_second_row_or_mail()
    {
        $subscriber = Subscriber::create(['email' => 'Jane@Example.com', 'status' => 'subscribed']);

        $this->post('/subscribe', ['email' => 'jane@example.com'])
            ->assertSessionHas('flash.message', self::FLASH);

        $this->assertDatabaseCount('subscribers', 1);
        $this->assertSame('subscribed', $subscriber->fresh()->status);
        $this->assertSame('Jane@Example.com', $subscriber->fresh()->email);
        Mail::assertNothingSent();
    }

    #[Test]
    public function a_legacy_mixed_case_unsubscribed_row_is_confirmed_in_place()
    {
        $subscriber = Subscriber::create(['email' => 'Jane@Example.com', 'status' => 'unsubscribed']);

        $this->post('/subscribe', ['email' => 'jane@example.com']);

        $this->assertDatabaseCount('subscribers', 1);
        $this->assertSame('unsubscribed', $subscriber->fresh()->status);

        $url = null;
        Mail::assertSent(SubscribeConfirmationMail::class, function (SubscribeConfirmationMail $mail) use (&$url) {
            $url = $mail->url;

            return $mail->hasTo('Jane@Example.com');
        });

        $this->get($url)->assertRedirect('/blog');
        $this->assertDatabaseCount('subscribers', 1);
        $this->assertSame('subscribed', $subscriber->fresh()->status);
        $this->assertSame('Jane@Example.com', $subscriber->fresh()->email);
    }

    #[Test]
    public function the_fourth_request_in_ten_minutes_sends_no_mail_but_the_same_flash()
    {
        foreach (range(1, 4) as $i) {
            $this->post('/subscribe', ['email' => 'Jane@example.com'])
                ->assertSessionHas('flash.message', self::FLASH);
        }

        Mail::assertSent(SubscribeConfirmationMail::class, 3);
    }

    #[Test]
    public function it_validates_required_email()
    {
        $response = $this->post('/subscribe', []);

        $response->assertSessionHasErrors(['email']);
        $this->assertDatabaseCount('subscribers', 0);
    }

    #[Test]
    public function it_validates_email_format()
    {
        $response = $this->post('/subscribe', ['email' => 'not-an-email']);

        $response->assertSessionHasErrors(['email']);
        $this->assertDatabaseCount('subscribers', 0);
    }

    #[Test]
    public function it_is_idempotent_for_a_repeat_email()
    {
        Subscriber::create([
            'email' => 'jane@example.com',
            'source' => 'homepage',
            'status' => 'subscribed',
        ]);

        $response = $this->post('/subscribe', [
            'email' => 'jane@example.com',
            'source' => 'bio',
        ]);

        $response->assertRedirect();
        $response->assertSessionHas('flash.type', 'success');
        $response->assertSessionHas('flash.message', self::FLASH);
        $this->assertDatabaseCount('subscribers', 1);
        Mail::assertNothingSent();

        // The original row wins; a repeat submission doesn't overwrite its source.
        $this->assertDatabaseHas('subscribers', [
            'email' => 'jane@example.com',
            'source' => 'homepage',
        ]);
    }

    #[Test]
    public function it_allows_a_subscription_with_no_source_or_referrer()
    {
        $response = $this->post('/subscribe', ['email' => 'jane@example.com']);

        $response->assertRedirect();
        $this->assertDatabaseHas('subscribers', [
            'email' => 'jane@example.com',
            'source' => null,
            'referrer' => null,
        ]);
    }

    #[Test]
    public function an_unsubscribed_reader_stays_unsubscribed_until_they_confirm()
    {
        Subscriber::create([
            'email' => 'jane@example.com',
            'source' => 'homepage',
            'status' => 'unsubscribed',
        ]);

        $response = $this->post('/subscribe', ['email' => 'jane@example.com']);

        $response->assertRedirect();
        $response->assertSessionHas('flash.message', self::FLASH);
        $this->assertDatabaseHas('subscribers', [
            'email' => 'jane@example.com',
            'source' => 'homepage',
            'status' => 'unsubscribed',
        ]);

        $url = null;
        Mail::assertSent(SubscribeConfirmationMail::class, function (SubscribeConfirmationMail $mail) use (&$url) {
            $url = $mail->url;

            return true;
        });

        $this->get($url)->assertRedirect('/blog');
        $this->assertDatabaseHas('subscribers', ['email' => 'jane@example.com', 'source' => 'homepage', 'status' => 'subscribed']);
    }

    #[Test]
    public function public_pages_count_pending_and_subscribed_but_not_unsubscribed()
    {
        Cache::flush();
        Subscriber::factory()->create();
        Subscriber::factory()->create(['status' => 'pending']);
        Subscriber::factory()->create(['status' => 'unsubscribed']);

        $shared = app(HandleInertiaRequests::class)->share(Request::create('/'));

        $this->assertSame(2, ($shared['newsletter']['subscriberCount'])());
    }
}
