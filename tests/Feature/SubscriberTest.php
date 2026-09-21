<?php

namespace Tests\Feature;

use App\Http\Middleware\HandleInertiaRequests;
use App\Models\Subscriber;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class SubscriberTest extends TestCase
{
    use RefreshDatabase;

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

        $this->assertDatabaseHas('subscribers', [
            'email' => 'jane@example.com',
            'source' => 'bio',
            'referrer' => 'direct',
            'status' => 'subscribed',
        ]);
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
        $this->assertDatabaseCount('subscribers', 1);

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
    public function it_resubscribes_a_reader_who_had_unsubscribed()
    {
        Subscriber::create([
            'email' => 'jane@example.com',
            'source' => 'homepage',
            'status' => 'unsubscribed',
        ]);

        $response = $this->post('/subscribe', ['email' => 'jane@example.com']);

        $response->assertRedirect();
        $this->assertDatabaseHas('subscribers', [
            'email' => 'jane@example.com',
            'source' => 'homepage',
            'status' => 'subscribed',
        ]);
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
