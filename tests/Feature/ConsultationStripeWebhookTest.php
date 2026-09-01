<?php

namespace Tests\Feature;

use App\Models\ConsultationBooking;
use App\Models\ConsultationStripeWebhookEvent;
use App\Models\ConsultationTier;
use App\Services\Consultation\BookingWorkflowService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ConsultationStripeWebhookTest extends TestCase
{
    use RefreshDatabase;

    private const SIGNING_SECRET = 'whsec_consultation_test';

    protected function setUp(): void
    {
        parent::setUp();

        config(['stripe.webhook_secret' => self::SIGNING_SECRET]);
    }

    public function test_invalid_webhook_signature_is_rejected_without_recording_an_event(): void
    {
        $response = $this->call(
            'POST',
            '/stripe/webhook',
            [],
            [],
            [],
            [
                'CONTENT_TYPE' => 'application/json',
                'HTTP_STRIPE_SIGNATURE' => 't=1,v1=invalid',
            ],
            '{}',
        );

        $response->assertStatus(400);
        $this->assertDatabaseCount('consultation_stripe_webhook_events', 0);
    }

    public function test_a_duplicate_webhook_is_acknowledged_without_confirming_twice(): void
    {
        $booking = $this->awaitingPaymentBooking();
        $workflow = $this->createMock(BookingWorkflowService::class);
        $workflow->expects($this->once())
            ->method('markPaidFromStripe')
            ->willReturn($booking);
        $this->app->instance(BookingWorkflowService::class, $workflow);

        $payload = $this->stripePayload($booking, 'evt_duplicate');

        $this->postWebhook($payload)->assertOk();
        $this->postWebhook($payload)->assertOk();

        $this->assertDatabaseHas('consultation_stripe_webhook_events', [
            'event_id' => 'evt_duplicate',
            'status' => ConsultationStripeWebhookEvent::STATUS_PROCESSED,
            'attempts' => 1,
            'consultation_booking_id' => $booking->id,
        ]);
    }

    public function test_a_failed_webhook_can_be_retried_and_is_not_lost(): void
    {
        $booking = $this->awaitingPaymentBooking();
        $calls = 0;
        $workflow = $this->createMock(BookingWorkflowService::class);
        $workflow->expects($this->exactly(2))
            ->method('markPaidFromStripe')
            ->willReturnCallback(function () use ($booking, &$calls) {
                $calls++;

                if ($calls === 1) {
                    throw new \RuntimeException('temporary confirmation failure');
                }

                return $booking;
            });
        $this->app->instance(BookingWorkflowService::class, $workflow);

        $payload = $this->stripePayload($booking, 'evt_retry');

        $this->postWebhook($payload)->assertStatus(500);
        $this->assertDatabaseHas('consultation_stripe_webhook_events', [
            'event_id' => 'evt_retry',
            'status' => ConsultationStripeWebhookEvent::STATUS_FAILED,
            'attempts' => 1,
        ]);

        $this->postWebhook($payload)->assertOk();
        $this->assertDatabaseHas('consultation_stripe_webhook_events', [
            'event_id' => 'evt_retry',
            'status' => ConsultationStripeWebhookEvent::STATUS_PROCESSED,
            'attempts' => 2,
        ]);
    }

    public function test_an_event_currently_being_processed_is_left_for_stripe_to_retry(): void
    {
        ConsultationStripeWebhookEvent::create([
            'event_id' => 'evt_in_flight',
            'type' => 'checkout.session.completed',
            'status' => ConsultationStripeWebhookEvent::STATUS_PROCESSING,
            'attempts' => 1,
        ]);

        $this->postWebhook($this->stripePayload(null, 'evt_in_flight'))->assertStatus(500);
    }

    private function awaitingPaymentBooking(): ConsultationBooking
    {
        $tier = ConsultationTier::query()->where('slug', 'light')->firstOrFail();
        $startsAt = now('UTC')->addDays(3)->setTime(10, 0);

        return ConsultationBooking::create([
            'consultation_tier_id' => $tier->id,
            'client_name' => 'Webhook client',
            'client_email' => 'webhook@example.com',
            'starts_at' => $startsAt,
            'ends_at' => $startsAt->copy()->addMinutes($tier->duration_minutes),
            'status' => ConsultationBooking::STATUS_AWAITING_PAYMENT,
            'list_price_cents' => $tier->price_cents,
            'amount_due_cents' => $tier->price_cents,
            'currency' => 'usd',
            'stripe_checkout_session_id' => 'cs_webhook',
            'payment_due_at' => now('UTC')->addDay(),
            'access_token_hash' => hash('sha256', 'webhook-token'),
        ]);
    }

    private function stripePayload(?ConsultationBooking $booking, string $eventId): string
    {
        return json_encode([
            'id' => $eventId,
            'object' => 'event',
            'created' => now('UTC')->timestamp,
            'livemode' => false,
            'pending_webhooks' => 1,
            'type' => 'checkout.session.completed',
            'data' => [
                'object' => [
                    'id' => 'cs_webhook',
                    'object' => 'checkout.session',
                    'client_reference_id' => $booking?->public_id,
                    'metadata' => [
                        'booking_public_id' => $booking?->public_id,
                    ],
                    'payment_intent' => 'pi_webhook',
                    'payment_status' => 'paid',
                    'amount_total' => $booking?->amount_due_cents,
                    'currency' => 'usd',
                ],
            ],
        ], JSON_THROW_ON_ERROR);
    }

    private function postWebhook(string $payload)
    {
        $timestamp = time();
        $signature = hash_hmac('sha256', $timestamp.'.'.$payload, self::SIGNING_SECRET);

        return $this->call(
            'POST',
            '/stripe/webhook',
            [],
            [],
            [],
            [
                'CONTENT_TYPE' => 'application/json',
                'HTTP_STRIPE_SIGNATURE' => "t={$timestamp},v1={$signature}",
            ],
            $payload,
        );
    }
}
