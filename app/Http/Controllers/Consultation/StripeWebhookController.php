<?php

namespace App\Http\Controllers\Consultation;

use App\Http\Controllers\Controller;
use App\Models\ConsultationBooking;
use App\Models\ConsultationStripeWebhookEvent;
use App\Services\Consultation\BookingWorkflowService;
use App\Services\Consultation\StripeCheckoutService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Stripe\Checkout\Session;
use Stripe\Event;

class StripeWebhookController extends Controller
{
    public function __invoke(Request $request, StripeCheckoutService $stripe, BookingWorkflowService $workflow): Response
    {
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

        $claim = $this->claimEvent($eventId, (string) $event->type);
        if ($claim['event'] === null) {
            return response($claim['retry'] ? 'Retry later' : 'ok', $claim['retry'] ? 500 : 200);
        }

        try {
            $this->processEvent($event, $stripe, $workflow, $claim['event']);
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

    /**
     * @return array{event: ?ConsultationStripeWebhookEvent, retry: bool}
     */
    protected function claimEvent(string $eventId, string $type): array
    {
        return DB::transaction(function () use ($eventId, $type): array {
            $now = now('UTC');

            DB::table('consultation_stripe_webhook_events')->insertOrIgnore([
                'event_id' => $eventId,
                'type' => $type,
                'status' => ConsultationStripeWebhookEvent::STATUS_PROCESSING,
                'attempts' => 0,
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            $webhookEvent = ConsultationStripeWebhookEvent::query()
                ->where('event_id', $eventId)
                ->lockForUpdate()
                ->firstOrFail();

            if ($webhookEvent->status === ConsultationStripeWebhookEvent::STATUS_PROCESSED) {
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
                'processed_at' => null,
            ])->save();

            return ['event' => $webhookEvent, 'retry' => false];
        });
    }

    protected function processEvent(
        Event $event,
        StripeCheckoutService $stripe,
        BookingWorkflowService $workflow,
        ConsultationStripeWebhookEvent $webhookEvent,
    ): void {
        if (! in_array($event->type, [
            'checkout.session.completed',
            'checkout.session.async_payment_succeeded',
        ], true)) {
            return;
        }

        /** @var Session $session */
        $session = $event->data->object;
        $paymentStatus = (string) ($session->payment_status ?? '');

        if (! in_array($paymentStatus, ['paid', 'no_payment_required'], true)) {
            return;
        }

        $metadata = $session->metadata;
        $metadataPublicId = is_array($metadata)
            ? ($metadata['booking_public_id'] ?? null)
            : (is_object($metadata) ? ($metadata->booking_public_id ?? null) : null);
        $publicId = $session->client_reference_id ?: $metadataPublicId;

        if (! is_string($publicId) || $publicId === '') {
            return;
        }

        $booking = ConsultationBooking::query()->where('public_id', $publicId)->first();
        if (! $booking) {
            return;
        }

        $webhookEvent->forceFill(['consultation_booking_id' => $booking->id])->save();

        if ($booking->amount_due_cents > 0 && $paymentStatus !== 'paid') {
            $this->refundRejectedPayment($stripe, null, $publicId, $session, 'payment was not marked paid');

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
            $this->refundRejectedPayment($stripe, $paymentIntentId, $publicId, $session, 'stale checkout session');

            return;
        }

        if ($session->amount_total === null && $booking->amount_due_cents > 0) {
            throw new \RuntimeException('Stripe session amount was missing.');
        }

        if ($session->amount_total !== null && (int) $session->amount_total !== $booking->amount_due_cents) {
            $this->refundRejectedPayment($stripe, $paymentIntentId, $publicId, $session, 'unexpected amount');

            return;
        }

        if (! $session->currency && $booking->amount_due_cents > 0) {
            throw new \RuntimeException('Stripe session currency was missing.');
        }

        if ($session->currency && strtolower((string) $session->currency) !== strtolower($booking->currency)) {
            $this->refundRejectedPayment($stripe, $paymentIntentId, $publicId, $session, 'unexpected currency');

            return;
        }

        try {
            $workflow->markPaidFromStripe(
                $booking,
                $session->id,
                $paymentIntentId,
            );
        } catch (\InvalidArgumentException $e) {
            Log::warning('Stripe booking event was not applicable', [
                'booking' => $publicId,
                'error' => $e->getMessage(),
            ]);

            $this->refundRejectedPayment($stripe, $paymentIntentId, $publicId, $session, $e->getMessage());
        }
    }

    protected function refundRejectedPayment(
        StripeCheckoutService $stripe,
        mixed $paymentIntentId,
        string $publicId,
        Session $session,
        string $reason,
    ): void {
        Log::warning('Refunding rejected Stripe consultation payment', [
            'booking' => $publicId,
            'session' => $session->id,
            'reason' => $reason,
        ]);

        if (! is_string($paymentIntentId) || $paymentIntentId === '') {
            return;
        }

        try {
            $stripe->refundPaymentIntent(
                $paymentIntentId,
                'consultation-invalid-payment-'.$session->id,
            );
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
        $this->sameAttemptQuery($webhookEvent)->update([
            'status' => ConsultationStripeWebhookEvent::STATUS_PROCESSED,
            'last_error' => null,
            'processed_at' => now('UTC'),
            'updated_at' => now('UTC'),
        ]);
    }

    protected function markFailed(ConsultationStripeWebhookEvent $webhookEvent, \Throwable $exception): void
    {
        $this->sameAttemptQuery($webhookEvent)->update([
            'status' => ConsultationStripeWebhookEvent::STATUS_FAILED,
            'last_error' => mb_substr($exception->getMessage(), 0, 2000),
            'updated_at' => now('UTC'),
        ]);
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
