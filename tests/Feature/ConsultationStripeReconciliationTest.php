<?php

namespace Tests\Feature;

use App\Models\ConsultationBooking;
use App\Models\ConsultationNotification;
use App\Models\ConsultationStripeCheckoutAttempt;
use App\Models\ConsultationTier;
use App\Services\Consultation\BookingWorkflowService;
use App\Services\Consultation\ConsultationStripeReconciliationService;
use App\Services\Consultation\GoogleCalendarService;
use App\Services\Consultation\StripeCheckoutService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Stripe\ApiRequestor;
use Stripe\Checkout\Session;
use Stripe\Exception\InvalidRequestException;
use Stripe\HttpClient\ClientInterface;
use Tests\TestCase;

class ConsultationStripeReconciliationTest extends TestCase
{
    use RefreshDatabase;

    protected function tearDown(): void
    {
        ApiRequestor::setHttpClient(null);

        parent::tearDown();
    }

    public function test_a_paid_checkout_is_confirmed_when_the_webhook_was_missed(): void
    {
        Mail::fake();
        config([
            'stripe.key' => 'pk_test',
            'stripe.secret' => 'sk_test',
        ]);
        $booking = $this->booking(['stripe_checkout_session_id' => 'cs_reconcile']);
        $this->fakeStripeSession([
            'id' => 'cs_reconcile',
            'status' => 'complete',
            'payment_status' => 'paid',
            'payment_intent' => 'pi_reconcile',
            'amount_total' => $booking->amount_due_cents,
            'currency' => 'usd',
        ]);

        $google = $this->createStub(GoogleCalendarService::class);
        $google->method('isConnected')->willReturn(false);
        $this->app->instance(GoogleCalendarService::class, $google);

        $this->assertSame(1, app(ConsultationStripeReconciliationService::class)->reconcile());
        $this->assertDatabaseHas('consultation_bookings', [
            'id' => $booking->id,
            'status' => ConsultationBooking::STATUS_CONFIRMED,
            'stripe_payment_intent_id' => 'pi_reconcile',
        ]);
    }

    public function test_an_approved_booking_without_a_checkout_is_recovered_and_notified(): void
    {
        Mail::fake();
        config([
            'stripe.key' => 'pk_test',
            'stripe.secret' => 'sk_test',
        ]);
        $booking = $this->booking();
        $this->fakeStripeSession([
            'id' => 'cs_recovered',
            'status' => 'open',
            'url' => 'https://checkout.stripe.test/cs_recovered',
            'payment_status' => 'unpaid',
        ]);

        $result = app(ConsultationStripeReconciliationService::class)->reconcile();

        $this->assertSame(1, $result);
        $this->assertDatabaseHas('consultation_stripe_checkout_attempts', [
            'consultation_booking_id' => $booking->id,
            'stripe_checkout_session_id' => 'cs_recovered',
            'status' => ConsultationStripeCheckoutAttempt::STATUS_CREATED,
        ]);
        $this->assertDatabaseHas('consultation_notifications', [
            'consultation_booking_id' => $booking->id,
            'mail_type' => 'awaiting_payment',
            'status' => ConsultationNotification::STATUS_SENT,
        ]);
        $this->assertNotSame(hash('sha256', 'old-token'), $booking->fresh()->access_token_hash);
    }

    public function test_an_existing_checkout_without_a_ledger_attempt_keeps_the_existing_access_token(): void
    {
        Mail::fake();
        $booking = $this->booking(['stripe_checkout_session_id' => 'cs_legacy_reconcile']);
        $session = Session::constructFrom([
            'id' => 'cs_legacy_reconcile',
            'status' => 'open',
            'url' => 'https://checkout.stripe.test/cs_legacy_reconcile',
            'payment_status' => 'unpaid',
        ]);

        $stripe = $this->createMock(StripeCheckoutService::class);
        $stripe->method('configured')->willReturn(true);
        $stripe->expects($this->once())
            ->method('retrieveCheckoutSession')
            ->with('cs_legacy_reconcile')
            ->willReturn($session);
        $this->app->instance(StripeCheckoutService::class, $stripe);

        $this->assertSame(1, app(ConsultationStripeReconciliationService::class)->reconcile());
        $this->assertSame(hash('sha256', 'old-token'), $booking->fresh()->access_token_hash);
        $this->assertDatabaseCount('consultation_stripe_checkout_attempts', 0);
    }

    public function test_a_missing_stripe_session_is_rotated_and_recreated(): void
    {
        Mail::fake();
        config([
            'stripe.key' => 'pk_test',
            'stripe.secret' => 'sk_test',
        ]);
        $booking = $this->booking(['stripe_checkout_session_id' => 'cs_missing']);

        $client = new class implements ClientInterface
        {
            public int $getRequests = 0;

            public function request($method, $absUrl, $headers, $params, $hasFile, $apiMode = 'v1', $maxNetworkRetries = null)
            {
                if (strtolower((string) $method) === 'get') {
                    $this->getRequests++;
                    throw InvalidRequestException::factory(
                        'No such checkout session',
                        404,
                        null,
                        ['error' => ['code' => 'resource_missing']],
                        [],
                        'resource_missing',
                    );
                }

                return [json_encode([
                    'id' => 'cs_replacement',
                    'object' => 'checkout.session',
                    'status' => 'open',
                    'url' => 'https://checkout.stripe.test/cs_replacement',
                    'payment_status' => 'unpaid',
                ]), 200, []];
            }
        };
        ApiRequestor::setHttpClient($client);

        $this->assertSame(1, app(ConsultationStripeReconciliationService::class)->reconcile());
        $this->assertSame('cs_replacement', $booking->fresh()->stripe_checkout_session_id);
        $this->assertNotSame(hash('sha256', 'old-token'), $booking->fresh()->access_token_hash);
        $this->assertSame(2, $client->getRequests);
    }

    public function test_a_paid_checkout_for_an_expired_booking_is_refunded(): void
    {
        $booking = $this->booking([
            'stripe_checkout_session_id' => 'cs_expired',
            'payment_due_at' => now('UTC')->subMinute(),
        ]);
        $session = Session::constructFrom([
            'id' => 'cs_expired',
            'status' => 'complete',
            'payment_status' => 'paid',
            'payment_intent' => 'pi_expired',
            'amount_total' => $booking->amount_due_cents,
            'currency' => 'usd',
        ]);

        $stripe = $this->createMock(StripeCheckoutService::class);
        $stripe->method('configured')->willReturn(true);
        $stripe->expects($this->once())
            ->method('retrieveCheckoutSession')
            ->with('cs_expired')
            ->willReturn($session);
        $stripe->expects($this->once())
            ->method('refundPaymentIntent')
            ->with('pi_expired', 'consultation-invalid-payment-cs_expired')
            ->willReturn('re_expired');

        $workflow = $this->createMock(BookingWorkflowService::class);
        $workflow->expects($this->once())
            ->method('markPaidFromStripe')
            ->willThrowException(new \InvalidArgumentException('The payment deadline has passed.'));

        $this->app->instance(StripeCheckoutService::class, $stripe);
        $this->app->instance(BookingWorkflowService::class, $workflow);

        $this->assertSame(1, app(ConsultationStripeReconciliationService::class)->reconcile());
        $fresh = $booking->fresh();
        $this->assertNull($fresh->stripe_paid_at);
        $this->assertSame('cs_expired', $fresh->stripe_checkout_rejected_session_id);
    }

    public function test_a_paid_checkout_is_refunded_after_the_booking_was_expired(): void
    {
        $booking = $this->booking([
            'status' => ConsultationBooking::STATUS_EXPIRED,
            'stripe_checkout_session_id' => 'cs_expired_status',
        ]);
        $session = Session::constructFrom([
            'id' => 'cs_expired_status',
            'status' => 'complete',
            'payment_status' => 'paid',
            'payment_intent' => 'pi_expired_status',
            'amount_total' => $booking->amount_due_cents,
            'currency' => 'usd',
        ]);

        $stripe = $this->createMock(StripeCheckoutService::class);
        $stripe->method('configured')->willReturn(true);
        $stripe->expects($this->once())
            ->method('retrieveCheckoutSession')
            ->with('cs_expired_status')
            ->willReturn($session);
        $stripe->expects($this->once())
            ->method('refundPaymentIntent')
            ->with('pi_expired_status', 'consultation-invalid-payment-cs_expired_status')
            ->willReturn('re_expired_status');

        $workflow = $this->createMock(BookingWorkflowService::class);
        $workflow->expects($this->never())->method('markPaidFromStripe');

        $this->app->instance(StripeCheckoutService::class, $stripe);
        $this->app->instance(BookingWorkflowService::class, $workflow);

        $this->assertSame(1, app(ConsultationStripeReconciliationService::class)->reconcile());
        $this->assertSame('cs_expired_status', $booking->fresh()->stripe_checkout_rejected_session_id);
    }

    public function test_an_expired_unpaid_checkout_is_marked_as_reconciled(): void
    {
        $booking = $this->booking([
            'status' => ConsultationBooking::STATUS_EXPIRED,
            'stripe_checkout_session_id' => 'cs_expired_unpaid',
        ]);
        $session = Session::constructFrom([
            'id' => 'cs_expired_unpaid',
            'status' => 'expired',
            'payment_status' => 'unpaid',
        ]);

        $stripe = $this->createMock(StripeCheckoutService::class);
        $stripe->method('configured')->willReturn(true);
        $stripe->expects($this->once())
            ->method('retrieveCheckoutSession')
            ->with('cs_expired_unpaid')
            ->willReturn($session);

        $this->app->instance(StripeCheckoutService::class, $stripe);

        $reconciliation = app(ConsultationStripeReconciliationService::class);
        $this->assertSame(1, $reconciliation->reconcile());
        $this->assertSame(0, $reconciliation->reconcile());
        $this->assertSame('cs_expired_unpaid', $booking->fresh()->stripe_checkout_rejected_session_id);
    }

    public function test_an_expired_booking_with_an_open_checkout_remains_retryable(): void
    {
        $booking = $this->booking([
            'status' => ConsultationBooking::STATUS_EXPIRED,
            'stripe_checkout_session_id' => 'cs_expired_open',
        ]);
        $session = Session::constructFrom([
            'id' => 'cs_expired_open',
            'status' => 'open',
            'payment_status' => 'unpaid',
            'url' => 'https://checkout.stripe.test/cs_expired_open',
        ]);

        $stripe = $this->createMock(StripeCheckoutService::class);
        $stripe->method('configured')->willReturn(true);
        $stripe->expects($this->once())
            ->method('retrieveCheckoutSession')
            ->with('cs_expired_open')
            ->willReturn($session);

        $this->app->instance(StripeCheckoutService::class, $stripe);

        $this->assertSame(0, app(ConsultationStripeReconciliationService::class)->reconcile());
        $fresh = $booking->fresh();
        $this->assertNull($fresh->stripe_checkout_rejected_session_id);
        $this->assertNotNull($fresh->stripe_checkout_next_attempt_at);
    }

    private function booking(array $overrides = []): ConsultationBooking
    {
        $tier = ConsultationTier::query()->where('slug', 'light')->firstOrFail();
        $startsAt = now('UTC')->addDays(3)->setTime(10, 0);

        return ConsultationBooking::create(array_merge([
            'consultation_tier_id' => $tier->id,
            'client_name' => 'Reconciliation client',
            'client_email' => 'reconciliation@example.com',
            'starts_at' => $startsAt,
            'ends_at' => $startsAt->copy()->addMinutes($tier->duration_minutes),
            'status' => ConsultationBooking::STATUS_AWAITING_PAYMENT,
            'list_price_cents' => $tier->price_cents,
            'amount_due_cents' => $tier->price_cents,
            'currency' => 'usd',
            'payment_due_at' => now('UTC')->addDay(),
            'access_token_hash' => hash('sha256', 'old-token'),
        ], $overrides));
    }

    private function fakeStripeSession(array $session): void
    {
        ApiRequestor::setHttpClient(new class($session) implements ClientInterface
        {
            public function __construct(private array $session) {}

            public function request($method, $absUrl, $headers, $params, $hasFile, $apiMode = 'v1', $maxNetworkRetries = null)
            {
                return [json_encode($this->session, JSON_THROW_ON_ERROR), 200, []];
            }
        });
    }
}
