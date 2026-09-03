<?php

namespace App\Services\Consultation;

use App\Models\ConsultationBooking;
use App\Models\ConsultationNotification;
use App\Models\ConsultationStripeCheckoutAttempt;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Stripe\Checkout\Session;
use Stripe\Exception\InvalidRequestException;

class ConsultationStripeReconciliationService
{
    public function __construct(
        protected StripeCheckoutService $stripe,
        protected BookingWorkflowService $workflow,
        protected ConsultationNotificationService $notifications,
    ) {}

    public function reconcile(int $limit = 50): int
    {
        if (! $this->stripe->configured()) {
            return 0;
        }

        $bookings = ConsultationBooking::query()
            ->where(function ($query) {
                $query->where('status', ConsultationBooking::STATUS_AWAITING_PAYMENT)
                    ->orWhere(function ($query) {
                        $query->where('status', ConsultationBooking::STATUS_EXPIRED)
                            ->whereNotNull('stripe_checkout_session_id');
                    });
            })
            ->where(function ($query) {
                $query->whereNull('stripe_checkout_rejected_session_id')
                    ->orWhereNull('stripe_checkout_session_id')
                    ->orWhereColumn('stripe_checkout_rejected_session_id', '!=', 'stripe_checkout_session_id');
            })
            ->where(function ($query) {
                $query->whereNull('stripe_checkout_next_attempt_at')
                    ->orWhere('stripe_checkout_next_attempt_at', '<=', now('UTC'));
            })
            ->orderBy('id')
            ->limit($limit)
            ->get();

        $reconciled = 0;
        foreach ($bookings as $booking) {
            try {
                if ($this->reconcileBooking($booking)) {
                    $reconciled++;
                }
            } catch (\InvalidArgumentException $e) {
                $this->rememberTerminalFailure($booking, $e);
                Log::warning('Stripe consultation checkout could not be reconciled', [
                    'booking' => $booking->public_id,
                    'error' => $e->getMessage(),
                ]);
            } catch (\Throwable $e) {
                $this->rememberFailure($booking, $e);
                Log::error('Stripe consultation checkout reconciliation failed', [
                    'booking' => $booking->public_id,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        return $reconciled;
    }

    protected function reconcileBooking(ConsultationBooking $booking): bool
    {
        $booking = ConsultationBooking::query()->with('tier')->findOrFail($booking->id);

        if (! in_array($booking->status, [
            ConsultationBooking::STATUS_AWAITING_PAYMENT,
            ConsultationBooking::STATUS_EXPIRED,
        ], true)) {
            return false;
        }

        $sessionId = (string) $booking->stripe_checkout_session_id;
        $idempotencyKey = $booking->stripe_checkout_idempotency_key;

        if ($booking->stripe_checkout_session_id) {
            try {
                $session = $this->stripe->retrieveCheckoutSession($sessionId);
            } catch (InvalidRequestException $e) {
                if ($e->getStripeCode() !== 'resource_missing') {
                    throw $e;
                }

                if ($booking->status === ConsultationBooking::STATUS_EXPIRED) {
                    $this->markRejectedCheckout($booking, $booking->stripe_checkout_session_id);

                    return true;
                }

                // Stripe can lose an expired session before the scheduler sees
                // it. Let checkout creation rotate the missing session and
                // persist a replacement attempt.
                $session = null;
            }

            if ($session) {
                $this->markCheckoutChecked($booking);

                if ($booking->status === ConsultationBooking::STATUS_EXPIRED) {
                    if ($this->isPaid($session)) {
                        $this->assertSessionMatchesBooking($booking, $session);
                        $paymentTimestamp = $this->paymentCompletedAt($session);

                        if (
                            $paymentTimestamp
                            && $booking->payment_due_at
                            && ! $paymentTimestamp->isAfter($booking->payment_due_at)
                        ) {
                            try {
                                $this->workflow->markPaidFromStripe(
                                    $booking,
                                    $session->id,
                                    $this->paymentIntentId($session),
                                    $paymentTimestamp,
                                );
                            } catch (\InvalidArgumentException $e) {
                                $this->refundRejectedPayment(
                                    $session,
                                    'booking could not accept the recovered payment: '.$e->getMessage(),
                                    $booking,
                                );
                            }

                            $this->notifications->deliverDueForBooking($booking->id);

                            return true;
                        }

                        $this->refundRejectedPayment($session, 'booking expired before payment reconciliation', $booking);

                        return true;
                    }

                    if (! in_array((string) ($session->status ?? ''), ['complete', 'expired'], true)) {
                        throw new \RuntimeException('The expired booking still has an open Stripe checkout.');
                    }

                    $this->markRejectedCheckout($booking, (string) $session->id);

                    return true;
                }

                if ($this->isPaid($session)) {
                    $this->assertSessionMatchesBooking($booking, $session);
                    $paymentIntentId = $this->paymentIntentId($session);

                    try {
                        $this->workflow->markPaidFromStripe(
                            $booking,
                            $session->id,
                            $paymentIntentId,
                            $this->paymentCompletedAt($session),
                        );
                    } catch (\InvalidArgumentException $e) {
                        $this->refundRejectedPayment(
                            $session,
                            'booking could not accept the payment: '.$e->getMessage(),
                            $booking,
                        );

                        return true;
                    }
                    $this->notifications->deliverDueForBooking($booking->id);

                    return true;
                }

                $failureReason = $this->stripe->unsettledPaymentFailureReason($session);
                if ($failureReason !== null) {
                    return $this->workflow->resetFailedStripePayment(
                        $booking,
                        $session->id,
                        $this->paymentIntentId($session),
                        $failureReason,
                    );
                }

                if (($session->status ?? null) === 'complete') {
                    // The Checkout Session can complete while an asynchronous
                    // payment is still settling. Wait for Stripe's succeeded
                    // event instead of creating a second checkout.
                    return false;
                }

                $checkoutUrl = isset($session->url) ? $session->url : null;
                if (($session->status ?? null) !== 'expired' && filled($checkoutUrl)) {
                    $token = $this->checkoutToken($booking);
                    if (! $this->queuePaymentMail($booking, $token, (string) $checkoutUrl, $sessionId, $idempotencyKey)) {
                        return false;
                    }

                    return true;
                }
            }
        }

        $token = $this->checkoutToken($booking) ?? Str::random(48);
        $checkoutUrl = $this->stripe->createCheckoutUrl($booking, $token);
        if (! $checkoutUrl) {
            return false;
        }

        $booking = $booking->fresh(['tier']);
        $canonicalToken = $this->checkoutToken($booking);
        $checkoutSessionId = $booking->stripe_checkout_session_id;
        $checkoutIdempotencyKey = $booking->stripe_checkout_idempotency_key;

        $booking = DB::transaction(function () use ($booking, $checkoutSessionId, $checkoutIdempotencyKey): ?ConsultationBooking {
            $current = ConsultationBooking::query()->lockForUpdate()->findOrFail($booking->id);

            if (
                $current->status !== ConsultationBooking::STATUS_AWAITING_PAYMENT
                || $current->stripe_checkout_session_id !== $checkoutSessionId
                || $current->stripe_checkout_idempotency_key !== $checkoutIdempotencyKey
            ) {
                return null;
            }

            $current->stripe_checkout_last_error = null;
            $current->stripe_checkout_next_attempt_at = null;
            $current->save();

            return $current->fresh(['tier']);
        });

        if (! $booking || ! $booking->stripe_checkout_session_id) {
            return false;
        }

        if (! $this->queuePaymentMail(
            $booking,
            $canonicalToken,
            $checkoutUrl,
            $checkoutSessionId,
            $checkoutIdempotencyKey,
        )) {
            return false;
        }

        return true;
    }

    protected function checkoutToken(ConsultationBooking $booking): ?string
    {
        $query = ConsultationStripeCheckoutAttempt::query()
            ->where('consultation_booking_id', $booking->id);

        if ($booking->stripe_checkout_idempotency_key) {
            $query->where('idempotency_key', $booking->stripe_checkout_idempotency_key);
        }

        $attempt = $query
            ->latest('id')
            ->first();

        if ($attempt && filled($attempt->access_token)) {
            return (string) $attempt->access_token;
        }

        return null;
    }

    protected function queuePaymentMail(
        ConsultationBooking $booking,
        ?string $token,
        string $checkoutUrl,
        string $sessionId,
        ?string $idempotencyKey,
    ): bool {
        $notification = DB::transaction(function () use ($booking, $token, $checkoutUrl, $sessionId, $idempotencyKey): ?ConsultationNotification {
            $current = ConsultationBooking::query()
                ->with('tier')
                ->lockForUpdate()
                ->findOrFail($booking->id);

            if (
                $current->status !== ConsultationBooking::STATUS_AWAITING_PAYMENT
                || $current->stripe_checkout_session_id !== $sessionId
                || $current->stripe_checkout_idempotency_key !== $idempotencyKey
            ) {
                return null;
            }

            $payload = [
                'plain_token' => $token,
                'checkout_url' => $checkoutUrl,
            ];
            if ($token !== null) {
                $payload['activate_access_token_hash'] = hash('sha256', $token);
                $payload['activate_access_token_expires_at'] = $current->ends_at?->copy()->addDays((int) config('consultation.access_token_days', 90))->toIso8601String();
            }
            $payload['stripe_checkout_session_id'] = $sessionId;
            $payload['stripe_checkout_idempotency_key'] = $idempotencyKey;

            return $this->notifications->enqueue(
                $current,
                $current->client_email,
                ConsultationNotificationService::TYPE_AWAITING_PAYMENT,
                $payload,
                'consultation-booking-'.$current->id.'-awaiting-payment-'.$sessionId,
            );
        });

        if (! $notification) {
            return false;
        }

        $this->notifications->deliverDueForBooking($booking->id);

        return true;
    }

    protected function isPaid(Session $session): bool
    {
        return in_array((string) ($session->payment_status ?? ''), ['paid', 'no_payment_required'], true);
    }

    protected function paymentIntentId(Session $session): ?string
    {
        $paymentIntent = isset($session->payment_intent) ? $session->payment_intent : null;

        return is_string($paymentIntent)
            ? $paymentIntent
            : (is_object($paymentIntent) ? ($paymentIntent->id ?? null) : null);
    }

    protected function paymentCompletedAt(Session $session): ?Carbon
    {
        $paymentIntent = isset($session->payment_intent) ? $session->payment_intent : null;
        $latestCharge = is_object($paymentIntent) && isset($paymentIntent->latest_charge)
            ? $paymentIntent->latest_charge
            : null;
        $timestamp = is_object($latestCharge) ? (int) ($latestCharge->created ?? 0) : 0;

        return $timestamp > 0 ? Carbon::createFromTimestamp($timestamp, 'UTC') : null;
    }

    protected function assertSessionMatchesBooking(ConsultationBooking $booking, Session $session): void
    {
        $amountTotal = isset($session->amount_total) ? $session->amount_total : null;
        $currency = isset($session->currency) ? $session->currency : null;

        if ($booking->amount_due_cents > 0 && ($session->payment_status ?? null) !== 'paid') {
            $this->refundRejectedPayment($session, 'payment was not marked paid', $booking);
            throw new \InvalidArgumentException('Stripe payment was rejected: payment was not marked paid.');
        }

        if ($booking->amount_due_cents > 0 && $amountTotal === null) {
            throw new \RuntimeException('Stripe session amount was missing.');
        }

        if ($booking->amount_due_cents > 0 && (int) $amountTotal !== $booking->amount_due_cents) {
            $this->refundRejectedPayment($session, 'unexpected amount', $booking);
            throw new \InvalidArgumentException('Stripe payment was rejected: unexpected amount.');
        }

        if ($booking->amount_due_cents > 0 && ! $this->paymentIntentId($session)) {
            throw new \RuntimeException('Stripe payment intent was missing.');
        }

        if (! $currency && $booking->amount_due_cents > 0) {
            throw new \RuntimeException('Stripe session currency was missing.');
        }

        if ($currency && strtolower((string) $currency) !== strtolower($booking->currency)) {
            $this->refundRejectedPayment($session, 'unexpected currency', $booking);
            throw new \InvalidArgumentException('Stripe payment was rejected: unexpected currency.');
        }
    }

    protected function refundRejectedPayment(
        Session $session,
        string $reason,
        ?ConsultationBooking $booking = null,
    ): void {
        $paymentIntentId = $this->paymentIntentId($session);
        if (! $paymentIntentId) {
            throw new \RuntimeException('Rejected Stripe payment could not be identified.');
        }

        try {
            $this->stripe->refundPaymentIntent(
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
                $this->workflow->resetRejectedStripePayment(
                    $booking,
                    (string) $session->id,
                    $paymentIntentId,
                    $reason,
                );
            }
        } catch (\Throwable $e) {
            throw new \RuntimeException('Rejected Stripe payment could not be refunded.', 0, $e);
        }
    }

    protected function rememberFailure(ConsultationBooking $booking, \Throwable $exception): void
    {
        $delay = max(5, (int) config('consultation.stripe_reconciliation_retry_minutes', 5));

        ConsultationBooking::query()
            ->whereKey($booking->id)
            ->update([
                'stripe_checkout_last_error' => mb_substr($exception->getMessage(), 0, 2000),
                'stripe_checkout_next_attempt_at' => now('UTC')->addMinutes($delay),
                'updated_at' => now('UTC'),
            ]);
    }

    protected function rememberTerminalFailure(ConsultationBooking $booking, \Throwable $exception): void
    {
        ConsultationBooking::query()
            ->whereKey($booking->id)
            ->update([
                'stripe_checkout_last_error' => mb_substr($exception->getMessage(), 0, 2000),
                'stripe_checkout_next_attempt_at' => null,
                'updated_at' => now('UTC'),
            ]);
    }

    protected function markCheckoutChecked(ConsultationBooking $booking): void
    {
        ConsultationBooking::query()
            ->whereKey($booking->id)
            ->update([
                'stripe_checkout_checked_at' => now('UTC'),
                'updated_at' => now('UTC'),
            ]);
    }

    protected function markRejectedCheckout(ConsultationBooking $booking, string $sessionId): void
    {
        ConsultationBooking::query()
            ->whereKey($booking->id)
            ->update([
                'stripe_checkout_rejected_session_id' => $sessionId,
                'updated_at' => now('UTC'),
            ]);
    }
}
