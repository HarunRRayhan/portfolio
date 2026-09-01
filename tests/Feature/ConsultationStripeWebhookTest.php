<?php

namespace Tests\Feature;

use App\Http\Controllers\Consultation\StripeWebhookController;
use App\Mail\Consultation\StripeWebhookUnmatchedMail;
use App\Models\ConsultationBooking;
use App\Models\ConsultationNotification;
use App\Models\ConsultationStripeCheckoutAttempt;
use App\Models\ConsultationStripeWebhookEvent;
use App\Models\ConsultationTier;
use App\Services\Consultation\BookingWorkflowService;
use App\Services\Consultation\ConsultationNotificationService;
use App\Services\Consultation\StripeCheckoutService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Stripe\ApiRequestor;
use Stripe\HttpClient\ClientInterface;
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

    protected function tearDown(): void
    {
        ApiRequestor::setHttpClient(null);

        parent::tearDown();
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

    public function test_a_rejected_payment_is_refunded_and_the_webhook_is_completed(): void
    {
        config([
            'stripe.key' => 'pk_test',
            'stripe.secret' => 'sk_test',
        ]);
        $booking = $this->awaitingPaymentBooking();
        $workflow = $this->createMock(BookingWorkflowService::class);
        $workflow->expects($this->never())->method('markPaidFromStripe');
        $this->app->instance(BookingWorkflowService::class, $workflow);
        ApiRequestor::setHttpClient(new class implements ClientInterface
        {
            public function request($method, $absUrl, $headers, $params, $hasFile, $apiMode = 'v1', $maxNetworkRetries = null)
            {
                return [json_encode(['id' => 'rejected_refund'], JSON_THROW_ON_ERROR), 200, []];
            }
        });

        $payload = $this->stripePayload($booking, 'evt_rejected', $booking->amount_due_cents - 1);

        $this->postWebhook($payload)->assertOk();
        $this->assertDatabaseHas('consultation_stripe_webhook_events', [
            'event_id' => 'evt_rejected',
            'status' => ConsultationStripeWebhookEvent::STATUS_PROCESSED,
        ]);
        $this->assertSame('cs_webhook', $booking->fresh()->stripe_checkout_rejected_session_id);
    }

    public function test_a_superseded_session_is_resolved_from_the_attempt_ledger_before_refund(): void
    {
        config([
            'stripe.key' => 'pk_test',
            'stripe.secret' => 'sk_test',
        ]);
        $booking = $this->awaitingPaymentBooking();
        $booking->forceFill(['stripe_checkout_session_id' => null])->save();
        ConsultationStripeCheckoutAttempt::create([
            'consultation_booking_id' => $booking->id,
            'idempotency_key' => 'consultation-checkout-old',
            'access_token' => '',
            'stripe_checkout_session_id' => 'cs_webhook',
            'status' => ConsultationStripeCheckoutAttempt::STATUS_SUPERSEDED,
            'attempts' => 1,
            'completed_at' => now('UTC'),
        ]);
        ApiRequestor::setHttpClient(new class implements ClientInterface
        {
            public function request($method, $absUrl, $headers, $params, $hasFile, $apiMode = 'v1', $maxNetworkRetries = null)
            {
                return [json_encode(['id' => 'rejected_superseded'], JSON_THROW_ON_ERROR), 200, []];
            }
        });

        $this->postWebhook($this->stripePayload($booking, 'evt_superseded'))->assertOk();

        $this->assertDatabaseHas('consultation_stripe_webhook_events', [
            'event_id' => 'evt_superseded',
            'status' => ConsultationStripeWebhookEvent::STATUS_PROCESSED,
            'consultation_booking_id' => $booking->id,
        ]);
        $this->assertDatabaseHas('consultation_bookings', [
            'id' => $booking->id,
            'status' => ConsultationBooking::STATUS_AWAITING_PAYMENT,
            'stripe_checkout_rejected_session_id' => 'cs_webhook',
        ]);
    }

    public function test_a_paid_superseded_session_is_refunded_without_touching_the_current_checkout(): void
    {
        config([
            'stripe.key' => 'pk_test',
            'stripe.secret' => 'sk_test',
        ]);
        $booking = $this->awaitingPaymentBooking();
        $booking->forceFill([
            'stripe_checkout_session_id' => 'cs_new',
            'stripe_checkout_idempotency_key' => 'consultation-checkout-new',
            'stripe_payment_intent_id' => 'pi_new',
        ])->save();
        ConsultationStripeCheckoutAttempt::create([
            'consultation_booking_id' => $booking->id,
            'idempotency_key' => 'consultation-checkout-old',
            'access_token' => 'old-token',
            'stripe_checkout_session_id' => 'cs_old',
            'status' => ConsultationStripeCheckoutAttempt::STATUS_SUPERSEDED,
            'attempts' => 1,
            'completed_at' => now('UTC'),
        ]);
        ApiRequestor::setHttpClient(new class implements ClientInterface
        {
            public function request($method, $absUrl, $headers, $params, $hasFile, $apiMode = 'v1', $maxNetworkRetries = null)
            {
                return [json_encode(['id' => 're_stale_paid'], JSON_THROW_ON_ERROR), 200, []];
            }
        });

        $this->postWebhook($this->stripePayload(
            $booking,
            'evt_stale_paid',
            $booking->amount_due_cents,
            'paid',
            'cs_old',
            'pi_old',
        ))->assertOk();

        $fresh = $booking->fresh();
        $this->assertSame(ConsultationBooking::STATUS_AWAITING_PAYMENT, $fresh->status);
        $this->assertSame('cs_new', $fresh->stripe_checkout_session_id);
        $this->assertSame('pi_new', $fresh->stripe_payment_intent_id);
        $this->assertSame('cs_old', $fresh->stripe_checkout_rejected_session_id);
        $this->assertNull($fresh->stripe_paid_at);
    }

    public function test_an_async_checkout_completion_waits_for_payment_without_rejecting_the_session(): void
    {
        $booking = $this->awaitingPaymentBooking();
        $workflow = $this->createMock(BookingWorkflowService::class);
        $workflow->expects($this->never())->method('markPaidFromStripe');
        $this->app->instance(BookingWorkflowService::class, $workflow);

        $payload = $this->stripePayload($booking, 'evt_async_pending', null, 'unpaid');

        $this->postWebhook($payload)->assertOk();
        $this->assertDatabaseHas('consultation_stripe_webhook_events', [
            'event_id' => 'evt_async_pending',
            'status' => ConsultationStripeWebhookEvent::STATUS_PROCESSED,
        ]);
        $this->assertNull($booking->fresh()->stripe_checkout_rejected_session_id);
        $this->assertSame('cs_webhook', $booking->fresh()->stripe_checkout_session_id);
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

    public function test_a_valid_paid_event_without_a_booking_is_acknowledged_and_alerts_the_admin(): void
    {
        Mail::fake();

        $this->postWebhook($this->stripePayload(null, 'evt_unmatched'))->assertOk();
        $this->postWebhook($this->stripePayload(null, 'evt_unmatched'))->assertOk();

        $this->assertDatabaseHas('consultation_stripe_webhook_events', [
            'event_id' => 'evt_unmatched',
            'status' => ConsultationStripeWebhookEvent::STATUS_UNMATCHED,
            'stripe_checkout_session_id' => 'cs_webhook',
        ]);
        $this->assertDatabaseHas('consultation_notifications', [
            'deduplication_key' => 'consultation-stripe-webhook-evt_unmatched-unmatched',
            'mail_type' => ConsultationNotificationService::TYPE_STRIPE_WEBHOOK_UNMATCHED,
            'status' => ConsultationNotification::STATUS_SENT,
        ]);
        Mail::assertSent(StripeWebhookUnmatchedMail::class);
        $this->assertDatabaseCount('consultation_notifications', 1);
        $this->assertNotNull(
            ConsultationStripeWebhookEvent::query()
                ->where('event_id', 'evt_unmatched')
                ->value('processed_at'),
        );
    }

    public function test_a_failed_event_can_be_replayed_from_its_encrypted_ledger_payload(): void
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

        $payload = $this->stripePayload($booking, 'evt_replay');
        $this->postWebhook($payload)->assertStatus(500);

        $ledgerEvent = ConsultationStripeWebhookEvent::query()
            ->where('event_id', 'evt_replay')
            ->firstOrFail();
        $this->assertSame($payload, $ledgerEvent->payload);

        $this->assertTrue(app(StripeWebhookController::class)->replayEvent(
            $ledgerEvent,
            app(StripeCheckoutService::class),
            app(BookingWorkflowService::class),
            app(ConsultationNotificationService::class),
            true,
        ));
        $this->assertDatabaseHas('consultation_stripe_webhook_events', [
            'event_id' => 'evt_replay',
            'status' => ConsultationStripeWebhookEvent::STATUS_PROCESSED,
            'attempts' => 2,
        ]);
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

    private function stripePayload(
        ?ConsultationBooking $booking,
        string $eventId,
        ?int $amountTotal = null,
        string $paymentStatus = 'paid',
        string $sessionId = 'cs_webhook',
        ?string $paymentIntentId = 'pi_webhook',
    ): string {
        return json_encode([
            'id' => $eventId,
            'object' => 'event',
            'created' => now('UTC')->timestamp,
            'livemode' => false,
            'pending_webhooks' => 1,
            'type' => 'checkout.session.completed',
            'data' => [
                'object' => [
                    'id' => $sessionId,
                    'object' => 'checkout.session',
                    'client_reference_id' => $booking?->public_id,
                    'metadata' => [
                        'booking_public_id' => $booking?->public_id,
                    ],
                    'payment_intent' => $paymentIntentId,
                    'payment_status' => $paymentStatus,
                    'amount_total' => $amountTotal ?? $booking?->amount_due_cents,
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
