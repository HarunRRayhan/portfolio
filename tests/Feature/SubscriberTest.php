<?php

namespace Tests\Feature;

use App\Http\Middleware\HandleInertiaRequests;
use App\Mail\SubscribeConfirmationMail;
use App\Models\Subscriber;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
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
    public function the_fourth_request_in_ten_minutes_sends_no_mail_but_the_same_flash()
    {
        foreach (range(1, 4) as $i) {
            $this->post('/subscribe', ['email' => 'Jane@example.com'])
                ->assertSessionHas('flash.message', self::FLASH);
        }

        Mail::assertSent(SubscribeConfirmationMail::class, 3);
    }

    #[Test]
    public function a_failed_turnstile_check_rejects_and_stores_nothing()
    {
        config(['services.turnstile.secret_key' => 'secret']);
        Http::fake(['challenges.cloudflare.com/*' => Http::response(['success' => false])]);

        $this->post('/subscribe', ['email' => 'bot@example.com', 'cf-turnstile-response' => 'bad'])
            ->assertSessionHasErrors('cf-turnstile-response');

        $this->post('/subscribe', ['email' => 'bot@example.com'])
            ->assertSessionHasErrors('cf-turnstile-response');

        $this->assertDatabaseCount('subscribers', 0);
        Mail::assertNothingSent();
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
    public function public_pages_share_the_active_subscriber_count()
    {
        Cache::flush();
        Subscriber::factory()->count(2)->create();
        Subscriber::factory()->create(['status' => 'unsubscribed']);

        $shared = app(HandleInertiaRequests::class)->share(Request::create('/'));

        $this->assertSame(2, ($shared['newsletter']['subscriberCount'])());
    }
}
