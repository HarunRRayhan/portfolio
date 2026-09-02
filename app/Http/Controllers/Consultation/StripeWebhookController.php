<?php

namespace App\Http\Controllers\Consultation;

use App\Http\Controllers\Controller;
use App\Models\ConsultationBooking;
use App\Models\ConsultationNotification;
use App\Models\ConsultationStripeCheckoutAttempt;
use App\Models\ConsultationStripeWebhookEvent;
use App\Services\Consultation\BookingWorkflowService;
use App\Services\Consultation\ConsultationNotificationService;
use App\Services\Consultation\StripeCheckoutService;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Stripe\Checkout\Session;
use Stripe\Event;

class StripeWebhookController extends Controller
{
    public function __invoke(
        Request $request,
        StripeCheckoutService $stripe,
        BookingWorkflowService $workflow,
        ConsultationNotificationService $notifications,
    ): Response {
        $payload = $request->getContent();
        $signature = $request->header('Stripe-Signature', '');

        try {
            $event = $stripe->constructEvent($payload, $signature);
        } catch (\Throwable $e) {
            Log::warning('Stripe webhook signature failed', ['error' => $e->getMessage()]);

            return response('Invalid signature', 400);
        }

        $eventId = (string) ($event->id ?? '');
        if ($eventId === '') {
            return response('Invalid event', 400);
        }

        $claim = $this->claimEvent($eventId, (string) $event->type, $payload);
        if ($claim['event'] === null) {
            return response($claim['retry'] ? 'Retry later' : 'ok', $claim['retry'] ? 500 : 200);
        }

        try {
            $this->processEvent($event, $stripe, $workflow, $notifications, $claim['event']);
            $this->markProcessed($claim['event']);

            return response('ok', 200);
        } catch (\Throwable $e) {
            $this->markFailed($claim['event'], $e);
            Log::error('Stripe booking webhook failed', [
                'event' => $eventId,
                'error' => $e->getMessage(),
            ]);

            return response('Retry later', 500);
        }
    }

    public function replayEvent(
        ConsultationStripeWebhookEvent $webhookEvent,
        StripeCheckoutService $stripe,
        BookingWorkflowService $workflow,
        ConsultationNotificationService $notifications,
        bool $force = false,
    ): bool {
        $payload = $webhookEvent->payload;
        if (! is_string($payload) || $payload === '') {
            throw new \RuntimeException('The webhook payload was not stored and cannot be replayed.');
        }

        if ($force) {
            DB::transaction(function () use ($webhookEvent): void {
                $current = ConsultationStripeWebhookEvent::query()->lockForUpdate()->findOrFail($webhookEvent->id);
                $current->forceFill([
                    'status' => ConsultationStripeWebhookEvent::STATUS_FAILED,
                    'last_error' => null,
                    'next_attempt_at' => null,
                    'processed_at' => null,
                    'updated_at' => now('UTC')->subMinutes((int) config('consultation.stripe_webhook_processing_timeout_minutes', 10) + 1),
                ])->save();
            });
        }

        $decoded = json_decode($payload, true, 512, JSON_THROW_ON_ERROR);
        $event = Event::constructFrom($decoded);
        $claim = $this->claimEvent($webhookEvent->event_id, (string) $event->type, $payload);

        if ($claim['event'] === null) {
            return false;
        }

        try {
            $this->processEvent($event, $stripe, $workflow, $notifications, $claim['event']);
            $this->markProcessed($claim['event']);

            return true;
        } catch (\Throwable $e) {
            $this->markFailed($claim['event'], $e);

            throw $e;
        }
    }

    /**
     * @return array{event: ?ConsultationStripeWebhookEvent, retry: bool}
     */
    protected function claimEvent(string $eventId, string $type, ?string $payload = null): array
    {
        return DB::transaction(function () use ($eventId, $type, $payload): array {
            $now = now('UTC');

            DB::table('consultation_stripe_webhook_events')->insertOrIgnore([
                'event_id' => $eventId,
                'type' => $type,
                'status' => ConsultationStripeWebhookEvent::STATUS_PROCESSING,
                'attempts' => 0,
                'payload' => $payload !== null ? Crypt::encryptString($payload) : null,
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            $webhookEvent = ConsultationStripeWebhookEvent::query()
                ->where('event_id', $eventId)
                ->lockForUpdate()
                ->firstOrFail();

            if ($payload !== null && $webhookEvent->payload === null) {
                $webhookEvent->forceFill([
                    'payload' => Crypt::encryptString($payload),
                ])->save();
            }

            if ($webhookEvent->status === ConsultationStripeWebhookEvent::STATUS_PROCESSED) {
                return ['event' => null, 'retry' => false];
            }

            if ($webhookEvent->status === ConsultationStripeWebhookEvent::STATUS_UNMATCHED) {
                return ['event' => null, 'retry' => false];
            }

            if (
                $webhookEvent->status === ConsultationStripeWebhookEvent::STATUS_PROCESSING
                && $webhookEvent->attempts > 0
                && $webhookEvent->updated_at?->gt($now->copy()->subMinutes((int) config('consultation.stripe_webhook_processing_timeout_minutes', 10)))
            ) {
                return ['event' => null, 'retry' => true];
            }

            $webhookEvent->forceFill([
                'type' => $type,
                'status' => ConsultationStripeWebhookEvent::STATUS_PROCESSING,
                'attempts' => $webhookEvent->attempts + 1,
                'last_error' => null,
                'next_attempt_at' => null,
                'processed_at' => null,
            ])->save();

            return ['event' => $webhookEvent, 'retry' => false];
        });
    }

    protected function processEvent(
        Event $event,
        StripeCheckoutService $stripe,
        BookingWorkflowService $workflow,
        ConsultationNotificationService $notifications,
        ConsultationStripeWebhookEvent $webhookEvent,
    ): void {
        if (! in_array($event->type, [
            'checkout.session.completed',
            'checkout.session.async_payment_succeeded',
            'checkout.session.async_payment_failed',
        ], true)) {
            return;
        }

        /** @var Session $session */
        $session = $event->data->object;
        $paymentStatus = (string) ($session->payment_status ?? '');

        $metadata = $session->metadata;
        $metadataPublicId = is_array($metadata)
            ? ($metadata['booking_public_id'] ?? null)
            : (is_object($metadata) ? ($metadata->booking_public_id ?? null) : null);
        $publicId = $session->client_reference_id ?: $metadataPublicId;
        $sessionId = (string) ($session->id ?? '');
        $booking = $sessionId !== ''
            ? ConsultationBooking::query()->where('stripe_checkout_session_id', $sessionId)->first()
            : null;

        if (! $booking && $sessionId !== '') {
            $attempt = ConsultationStripeCheckoutAttempt::query()
                ->with('booking')
                ->where('stripe_checkout_session_id', $sessionId)
                ->latest('id')
                ->first();
            $booking = $attempt?->booking;

            if ($booking && is_string($publicId) && $publicId !== '' && $booking->public_id !== $publicId) {
                $booking = null;
            }
        }

        if (! $booking) {
            $this->markUnmatched(
                $webhookEvent,
                $notifications,
                is_string($publicId) && $publicId !== ''
                    ? 'No consultation booking matched the supplied booking reference.'
                    : 'The event did not include a booking reference.',
                $sessionId,
                is_string($publicId) && $publicId !== '' ? $publicId : null,
            );

            return;
        }

        $publicId = $booking->public_id;

        $claimedContextUpdated = $this->sameAttemptQuery($webhookEvent)->update([
            'consultation_booking_id' => $booking->id,
            'booking_public_id' => $publicId,
            'stripe_checkout_session_id' => $sessionId ?: null,
            'updated_at' => now('UTC'),
        ]);

        if ($claimedContextUpdated !== 1) {
            return;
        }

        if ($event->type === 'checkout.session.async_payment_failed') {
            if ($booking->stripe_checkout_session_id !== $sessionId) {
                return;
            }

            $paymentIntent = $session->payment_intent;
            $paymentIntentId = is_string($paymentIntent)
                ? $paymentIntent
                : (is_object($paymentIntent) ? ($paymentIntent->id ?? null) : null);

            $workflow->resetFailedStripePayment(
                $booking,
                $sessionId,
                $paymentIntentId,
                'Stripe asynchronous payment failed.',
            );

            return;
        }

        if (! in_array($paymentStatus, ['paid', 'no_payment_required'], true)) {
            return;
        }

        if ($booking->amount_due_cents > 0 && $paymentStatus !== 'paid') {
            // Checkout can be completed before an asynchronous payment settles.
            // Wait for async_payment_succeeded or reconciliation instead of
            // treating the still-pending session as a rejected payment.
            return;
        }

        $paymentIntent = $session->payment_intent;
        $paymentIntentId = is_string($paymentIntent)
            ? $paymentIntent
            : (is_object($paymentIntent) ? ($paymentIntent->id ?? null) : null);

        if ($booking->amount_due_cents > 0 && (! is_string($paymentIntentId) || $paymentIntentId === '')) {
            throw new \RuntimeException('Stripe payment intent was missing.');
        }

        if ($booking->stripe_checkout_session_id && $booking->stripe_checkout_session_id !== $session->id) {
            $this->refundRejectedPayment($stripe, $workflow, $paymentIntentId, $publicId, $session, 'stale checkout session', $booking);

            return;
        }

        if ($session->amount_total === null && $booking->amount_due_cents > 0) {
            throw new \RuntimeException('Stripe session amount was missing.');
        }

        if ($session->amount_total !== null && (int) $session->amount_total !== $booking->amount_due_cents) {
            $this->refundRejectedPayment($stripe, $workflow, $paymentIntentId, $publicId, $session, 'unexpected amount', $booking);

            return;
        }

        if (! $session->currency && $booking->amount_due_cents > 0) {
            throw new \RuntimeException('Stripe session currency was missing.');
        }

        if ($session->currency && strtolower((string) $session->currency) !== strtolower($booking->currency)) {
            $this->refundRejectedPayment($stripe, $workflow, $paymentIntentId, $publicId, $session, 'unexpected currency', $booking);

            return;
        }

        try {
            $workflow->markPaidFromStripe(
                $booking,
                $session->id,
                $paymentIntentId,
                $this->eventCreatedAt($event),
            );
        } catch (\InvalidArgumentException $e) {
            Log::warning('Stripe booking event was not applicable', [
                'booking' => $publicId,
                'error' => $e->getMessage(),
            ]);

            $this->refundRejectedPayment($stripe, $workflow, $paymentIntentId, $publicId, $session, $e->getMessage(), $booking);
        }
    }

    protected function refundRejectedPayment(
        StripeCheckoutService $stripe,
        BookingWorkflowService $workflow,
        mixed $paymentIntentId,
        string $publicId,
        Session $session,
        string $reason,
        ?ConsultationBooking $booking = null,
    ): void {
        Log::warning('Refunding rejected Stripe consultation payment', [
            'booking' => $publicId,
            'session' => $session->id,
            'reason' => $reason,
        ]);

        if (! is_string($paymentIntentId) || $paymentIntentId === '') {
            if ($booking) {
                ConsultationBooking::query()
                    ->whereKey($booking->id)
                    ->update([
                        'stripe_checkout_rejected_session_id' => (string) $session->id,
                        'updated_at' => now('UTC'),
                    ]);
            }

            return;
        }

        try {
            $stripe->refundPaymentIntent(
                $paymentIntentId,
                'consultation-invalid-payment-'.$session->id,
            );

            if ($booking) {
                ConsultationBooking::query()
                    ->whereKey($booking->id)
                    ->update([
                        'stripe_checkout_rejected_session_id' => (string) $session->id,
                        'updated_at' => now('UTC'),
                    ]);
                $workflow->resetRejectedStripePayment(
                    $booking,
                    (string) $session->id,
                    $paymentIntentId,
                    $reason,
                );
            }
        } catch (\Throwable $e) {
            Log::error('Rejected Stripe consultation payment could not be refunded', [
                'booking' => $publicId,
                'session' => $session->id,
                'error' => $e->getMessage(),
            ]);

            throw new \RuntimeException('Rejected Stripe payment could not be refunded.', 0, $e);
        }
    }

    protected function markProcessed(ConsultationStripeWebhookEvent $webhookEvent): void
    {
        if ($webhookEvent->status === ConsultationStripeWebhookEvent::STATUS_UNMATCHED) {
            ConsultationStripeWebhookEvent::query()
                ->whereKey($webhookEvent->id)
                ->where('attempts', $webhookEvent->attempts)
                ->where('status', ConsultationStripeWebhookEvent::STATUS_UNMATCHED)
                ->update([
                    'processed_at' => now('UTC'),
                    'next_attempt_at' => null,
                    'updated_at' => now('UTC'),
                ]);

            return;
        }

        $this->sameAttemptQuery($webhookEvent)->update([
            'status' => ConsultationStripeWebhookEvent::STATUS_PROCESSED,
            'last_error' => null,
            'next_attempt_at' => null,
            'processed_at' => now('UTC'),
            'updated_at' => now('UTC'),
        ]);
    }

    protected function markUnmatched(
        ConsultationStripeWebhookEvent $webhookEvent,
        ConsultationNotificationService $notifications,
        string $reason,
        ?string $sessionId,
        ?string $bookingPublicId,
    ): void {
        $notification = DB::transaction(function () use (
            $webhookEvent,
            $notifications,
            $reason,
            $sessionId,
            $bookingPublicId,
        ): ?ConsultationNotification {
            $updated = ConsultationStripeWebhookEvent::query()
                ->whereKey($webhookEvent->id)
                ->where('attempts', $webhookEvent->attempts)
                ->where('status', ConsultationStripeWebhookEvent::STATUS_PROCESSING)
                ->update([
                    'status' => ConsultationStripeWebhookEvent::STATUS_UNMATCHED,
                    'stripe_checkout_session_id' => $sessionId ?: null,
                    'booking_public_id' => $bookingPublicId,
                    'last_error' => $reason,
                    'unmatched_at' => now('UTC'),
                    'updated_at' => now('UTC'),
                ]);

            if ($updated !== 1) {
                return null;
            }

            $current = ConsultationStripeWebhookEvent::query()->findOrFail($webhookEvent->id);

            /*
             * The notification is inserted only by the claim that changed
             * the ledger row, so an expired worker cannot alert twice.
             */
            return $notifications->enqueue(
                null,
                config('mail.to.address'),
                ConsultationNotificationService::TYPE_STRIPE_WEBHOOK_UNMATCHED,
                [
                    'event_id' => $current->event_id,
                    'event_type' => $current->type,
                    'reason' => $reason,
                    'session_id' => $sessionId,
                    'booking_public_id' => $bookingPublicId,
                ],
                'consultation-stripe-webhook-'.$current->event_id.'-unmatched',
            );
        });

        if (! $notification) {
            return;
        }

        $webhookEvent->forceFill([
            'status' => ConsultationStripeWebhookEvent::STATUS_UNMATCHED,
        ]);

        $notifications->deliver($notification);
    }

    protected function markFailed(ConsultationStripeWebhookEvent $webhookEvent, \Throwable $exception): void
    {
        $delay = min(60 * 24, max(5, 2 ** min($webhookEvent->attempts, 8)));

        $this->sameAttemptQuery($webhookEvent)->update([
            'status' => ConsultationStripeWebhookEvent::STATUS_FAILED,
            'last_error' => mb_substr($exception->getMessage(), 0, 2000),
            'next_attempt_at' => now('UTC')->addMinutes($delay),
            'updated_at' => now('UTC'),
        ]);
    }

    protected function eventCreatedAt(Event $event): ?Carbon
    {
        $timestamp = (int) ($event->created ?? 0);

        return $timestamp > 0 ? Carbon::createFromTimestamp($timestamp, 'UTC') : null;
    }

    /** @return Builder<ConsultationStripeWebhookEvent> */
    protected function sameAttemptQuery(ConsultationStripeWebhookEvent $webhookEvent): Builder
    {
        return ConsultationStripeWebhookEvent::query()
            ->whereKey($webhookEvent->id)
            ->where('attempts', $webhookEvent->attempts)
            ->where('status', ConsultationStripeWebhookEvent::STATUS_PROCESSING);
    }
}
