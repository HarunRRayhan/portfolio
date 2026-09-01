<?php

namespace Tests\Feature;

use App\Models\ConsultationBooking;
use App\Models\ConsultationStripeCheckoutAttempt;
use App\Models\ConsultationTier;
use App\Services\Consultation\StripeCheckoutService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\URL;
use Stripe\ApiRequestor;
use Stripe\HttpClient\ClientInterface;
use Tests\TestCase;

class ConsultationStripeCheckoutTest extends TestCase
{
    use RefreshDatabase;

    protected function tearDown(): void
    {
        ApiRequestor::setHttpClient(null);

        parent::tearDown();
    }

    public function test_a_new_checkout_uses_a_booking_stable_idempotency_key(): void
    {
        config([
            'stripe.key' => 'pk_test',
            'stripe.secret' => 'sk_test',
        ]);

        $tier = ConsultationTier::query()->where('slug', 'light')->firstOrFail();
        $startsAt = now('UTC')->addDays(3)->setTime(10, 0);
        $booking = ConsultationBooking::create([
            'consultation_tier_id' => $tier->id,
            'client_name' => 'Checkout client',
            'client_email' => 'checkout@example.com',
            'starts_at' => $startsAt,
            'ends_at' => $startsAt->copy()->addMinutes($tier->duration_minutes),
            'status' => ConsultationBooking::STATUS_AWAITING_PAYMENT,
            'list_price_cents' => $tier->price_cents,
            'amount_due_cents' => $tier->price_cents,
            'currency' => 'usd',
            'payment_due_at' => now('UTC')->addDay(),
            'access_token_hash' => hash('sha256', 'checkout-token'),
        ]);

        $client = new class implements ClientInterface
        {
            public array $requests = [];

            public function request($method, $absUrl, $headers, $params, $hasFile, $apiMode = 'v1', $maxNetworkRetries = null)
            {
                $this->requests[] = [
                    'method' => $method,
                    'headers' => $headers,
                    'params' => $params,
                ];

                return [
                    json_encode([
                        'id' => 'cs_stable',
                        'object' => 'checkout.session',
                        'status' => 'open',
                        'url' => 'https://checkout.stripe.test/cs_stable',
                        'payment_status' => 'unpaid',
                    ]),
                    200,
                    [],
                ];
            }
        };
        ApiRequestor::setHttpClient($client);

        $url = app(StripeCheckoutService::class)->createCheckoutUrl($booking, 'plain-token');

        $this->assertSame('https://checkout.stripe.test/cs_stable', $url);
        $this->assertCount(1, $client->requests);
        $this->assertStringNotContainsString('token=', $client->requests[0]['params']['success_url']);
        $this->assertStringContainsString('/book/b/'.$booking->public_id.'/stripe-return', $client->requests[0]['params']['success_url']);
        $this->assertStringContainsString(
            'Idempotency-Key: consultation-checkout-'.$booking->id,
            implode("\n", $client->requests[0]['headers']),
        );
        $this->assertDatabaseHas('consultation_bookings', [
            'id' => $booking->id,
            'stripe_checkout_session_id' => 'cs_stable',
            'stripe_checkout_idempotency_key' => 'consultation-checkout-'.$booking->id,
        ]);
        $this->assertDatabaseHas('consultation_stripe_checkout_attempts', [
            'consultation_booking_id' => $booking->id,
            'idempotency_key' => 'consultation-checkout-'.$booking->id,
            'stripe_checkout_session_id' => 'cs_stable',
            'status' => ConsultationStripeCheckoutAttempt::STATUS_CREATED,
        ]);
    }

    public function test_an_existing_session_without_an_attempt_does_not_replace_the_booking_token(): void
    {
        config([
            'stripe.key' => 'pk_test',
            'stripe.secret' => 'sk_test',
        ]);

        $tier = ConsultationTier::query()->where('slug', 'light')->firstOrFail();
        $booking = ConsultationBooking::create([
            'consultation_tier_id' => $tier->id,
            'client_name' => 'Legacy checkout client',
            'client_email' => 'legacy-checkout@example.com',
            'starts_at' => now('UTC')->addDays(3)->setTime(10, 0),
            'ends_at' => now('UTC')->addDays(3)->setTime(10, 30),
            'status' => ConsultationBooking::STATUS_AWAITING_PAYMENT,
            'list_price_cents' => $tier->price_cents,
            'amount_due_cents' => $tier->price_cents,
            'currency' => 'usd',
            'stripe_checkout_session_id' => 'cs_legacy',
            'payment_due_at' => now('UTC')->addDay(),
            'access_token_hash' => hash('sha256', 'legacy-token'),
        ]);

        ApiRequestor::setHttpClient(new class implements ClientInterface
        {
            public function request($method, $absUrl, $headers, $params, $hasFile, $apiMode = 'v1', $maxNetworkRetries = null)
            {
                return [json_encode([
                    'id' => 'cs_legacy',
                    'object' => 'checkout.session',
                    'status' => 'open',
                    'url' => 'https://checkout.stripe.test/cs_legacy',
                    'payment_status' => 'unpaid',
                ]), 200, []];
            }
        });

        $this->assertSame(
            'https://checkout.stripe.test/cs_legacy',
            app(StripeCheckoutService::class)->createCheckoutUrl($booking, 'new-token'),
        );
        $this->assertSame(hash('sha256', 'legacy-token'), $booking->fresh()->access_token_hash);
        $this->assertSame('', (string) $booking->fresh()->stripeCheckoutAttempts()->latest('id')->firstOrFail()->access_token);
    }

    public function test_signed_stripe_return_grants_only_the_current_booking_session(): void
    {
        $tier = ConsultationTier::query()->where('slug', 'light')->firstOrFail();
        $booking = ConsultationBooking::create([
            'consultation_tier_id' => $tier->id,
            'client_name' => 'Return client',
            'client_email' => 'return@example.com',
            'starts_at' => now('UTC')->addDays(3)->setTime(10, 0),
            'ends_at' => now('UTC')->addDays(3)->setTime(10, 30),
            'status' => ConsultationBooking::STATUS_AWAITING_PAYMENT,
            'list_price_cents' => $tier->price_cents,
            'amount_due_cents' => $tier->price_cents,
            'currency' => 'usd',
            'payment_due_at' => now('UTC')->addDay(),
            'access_token_hash' => hash('sha256', 'return-token'),
        ]);

        $url = URL::temporarySignedRoute(
            'book.stripe-return',
            now('UTC')->addHour(),
            ['publicId' => $booking->public_id, 'return' => 'paid'],
        );

        $this->get($url)->assertRedirect('/book/b/'.$booking->public_id.'?paid=1');
        $this->get('/book/b/'.$booking->public_id)->assertOk();
    }
}
