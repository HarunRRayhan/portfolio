<?php

namespace App\Services\Consultation;

use App\Models\ConsultationBooking;
use App\Models\ConsultationStripeCheckoutAttempt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\URL;
use Stripe\Checkout\Session;
use Stripe\Event;
use Stripe\Exception\InvalidRequestException;
use Stripe\Refund;
use Stripe\Stripe;
use Stripe\Webhook;

class StripeCheckoutService
{
    public function configured(): bool
    {
        return filled(config('stripe.secret')) && filled(config('stripe.key'));
    }

    public function createCheckoutUrl(ConsultationBooking $booking, string $plainToken): ?string
    {
        if (! $this->configured() || $booking->amount_due_cents <= 0) {
            return null;
        }

        Stripe::setApiKey(config('stripe.secret'));

        $booking = DB::transaction(function () use ($booking) {
            $booking = ConsultationBooking::query()
                ->with('tier')
                ->lockForUpdate()
                ->findOrFail($booking->id);

            $this->assertCheckoutAllowed($booking);

            return $booking;
        });

        $attempt = $this->beginAttempt($booking, $plainToken);
        $booking = $attempt->booking()->with('tier')->firstOrFail();

        $expiredSessionId = null;

        if ($booking->stripe_checkout_session_id) {
            try {
                $existing = Session::retrieve($booking->stripe_checkout_session_id);
                $status = (string) ($existing->status ?? '');

                if (in_array($status, ['open', 'complete'], true) && filled($existing->url)) {
                    $this->markAttemptCreated($attempt, $existing->id);

                    return $existing->url;
                }

                if (($existing->payment_status ?? null) === 'paid') {
                    $this->markAttemptCreated($attempt, $existing->id);

                    return $existing->url;
                }

                if ($status !== 'expired') {
                    throw new \RuntimeException('The existing Stripe checkout session is not available.');
                }
            } catch (InvalidRequestException $e) {
                if ($e->getStripeCode() !== 'resource_missing') {
                    $this->markAttemptFailed($attempt, $e);

                    throw new \RuntimeException('The existing Stripe checkout session could not be checked.', 0, $e);
                }

                $this->markAttemptSuperseded($attempt, 'The existing Stripe checkout session was not found.');
            } catch (\RuntimeException $e) {
                $this->markAttemptFailed($attempt, $e);

                throw $e;
            } catch (\Throwable $e) {
                $this->markAttemptFailed($attempt, $e);

                Log::warning('Could not inspect existing Stripe checkout session', [
                    'booking' => $booking->public_id,
                    'session' => $booking->stripe_checkout_session_id,
                    'error' => $e->getMessage(),
                ]);

                throw new \RuntimeException('The existing Stripe checkout session could not be checked.', 0, $e);
            }

            $expiredSessionId = $booking->stripe_checkout_session_id;
            $this->markAttemptSuperseded($attempt, 'The existing Stripe checkout session expired.');
            $booking = DB::transaction(function () use ($booking, $expiredSessionId) {
                $current = ConsultationBooking::query()
                    ->with('tier')
                    ->lockForUpdate()
                    ->findOrFail($booking->id);

                $this->assertCheckoutAllowed($current);

                if ($current->stripe_checkout_session_id !== $expiredSessionId) {
                    return $current;
                }

                $current->stripe_checkout_session_id = null;
                $current->stripe_checkout_idempotency_key = 'consultation-checkout-retry-'.substr(
                    hash('sha256', $current->id.'-'.$expiredSessionId),
                    0,
                    48,
                );
                $current->save();

                return $current;
            });

            $attempt = $this->beginAttempt($booking, $plainToken);
            $booking = $attempt->booking()->with('tier')->firstOrFail();

            if ($booking->stripe_checkout_session_id && $booking->stripe_checkout_session_id !== $expiredSessionId) {
                try {
                    $existing = Session::retrieve($booking->stripe_checkout_session_id);

                    if (filled($existing->url)) {
                        $this->markAttemptCreated($attempt, $existing->id);

                        return $existing->url;
                    }
                } catch (\Throwable $e) {
                    $this->markAttemptFailed($attempt, $e);

                    throw new \RuntimeException('The existing Stripe checkout session could not be checked.', 0, $e);
                }
            }
        }

        $booking = DB::transaction(function () use ($booking, $expiredSessionId) {
            $current = ConsultationBooking::query()
                ->with('tier')
                ->lockForUpdate()
                ->findOrFail($booking->id);

            $this->assertCheckoutAllowed($current);

            if (! $current->stripe_checkout_idempotency_key) {
                $current->stripe_checkout_idempotency_key = $expiredSessionId
                    ? 'consultation-checkout-retry-'.substr(hash('sha256', $current->id.'-'.$expiredSessionId), 0, 48)
                    : 'consultation-checkout-'.$current->id;
                $current->save();
            }

            return $current;
        });

        $now = now('UTC');
        $expiresAt = $now->copy()->addHours(23);
        if ($booking->payment_due_at && $booking->payment_due_at->lessThan($expiresAt)) {
            $expiresAt = $booking->payment_due_at->copy();
        }
        $returnExpiresAt = $expiresAt->copy()->addMinutes(15);
        $success = URL::temporarySignedRoute(
            'book.stripe-return',
            $returnExpiresAt,
            ['publicId' => $booking->public_id, 'return' => 'paid'],
        );
        $cancel = URL::temporarySignedRoute(
            'book.stripe-return',
            $returnExpiresAt,
            ['publicId' => $booking->public_id, 'return' => 'cancelled_checkout'],
        );

        try {
            $session = Session::create([
                'mode' => 'payment',
                'success_url' => $success,
                'cancel_url' => $cancel,
                'customer_email' => $booking->client_email,
                'client_reference_id' => $booking->public_id,
                'metadata' => [
                    'booking_public_id' => $booking->public_id,
                ],
                'line_items' => [[
                    'quantity' => 1,
                    'price_data' => [
                        'currency' => $booking->currency ?: 'usd',
                        'unit_amount' => $booking->amount_due_cents,
                        'product_data' => [
                            'name' => $booking->tier->name,
                            'description' => 'Consultation on '.$booking->starts_at->timezone('UTC')->toDayDateTimeString().' UTC',
                        ],
                    ],
                ]],
                'expires_at' => $expiresAt->timestamp,
            ], [
                'idempotency_key' => $booking->stripe_checkout_idempotency_key,
            ]);

            $this->bindAttemptSession($attempt, (string) $session->id);

            DB::transaction(function () use ($booking, $session, $attempt) {
                $current = ConsultationBooking::query()
                    ->lockForUpdate()
                    ->findOrFail($booking->id);

                $currentAttempt = ConsultationStripeCheckoutAttempt::query()
                    ->lockForUpdate()
                    ->find($attempt->id);

                if (
                    ! $currentAttempt
                    || $currentAttempt->status !== ConsultationStripeCheckoutAttempt::STATUS_PROCESSING
                    || $currentAttempt->attempts !== $attempt->attempts
                    || $currentAttempt->idempotency_key !== $current->stripe_checkout_idempotency_key
                ) {
                    throw new \RuntimeException('The Stripe checkout attempt was superseded.');
                }

                if ($current->stripe_checkout_session_id && $current->stripe_checkout_session_id !== $session->id) {
                    throw new \RuntimeException('A different Stripe checkout session is already attached.');
                }

                if (! in_array($current->status, [
                    ConsultationBooking::STATUS_AWAITING_PAYMENT,
                    ConsultationBooking::STATUS_CONFIRMED,
                ], true)) {
                    throw new \RuntimeException('Booking is no longer available for Stripe checkout.');
                }

                $current->stripe_checkout_session_id = $session->id;
                $current->stripe_checkout_last_error = null;
                $current->stripe_checkout_next_attempt_at = null;
                $current->save();
            });

            $this->markAttemptCreated($attempt, $session->id);

            return $session->url;
        } catch (\Throwable $e) {
            $this->markAttemptFailed($attempt, $e);

            throw $e;
        }
    }

    protected function assertCheckoutAllowed(ConsultationBooking $booking): void
    {
        if ($booking->status !== ConsultationBooking::STATUS_AWAITING_PAYMENT) {
            throw new \InvalidArgumentException('Booking is not awaiting payment.');
        }

        $now = now('UTC');
        $minimumLifetime = max(30, (int) config('consultation.stripe_checkout_min_minutes', 31));

        if ($booking->payment_due_at && $booking->payment_due_at->lte($now)) {
            throw new \InvalidArgumentException('The payment deadline for this booking has passed.');
        }

        if ($booking->payment_due_at && $booking->payment_due_at->lte($now->copy()->addMinutes($minimumLifetime))) {
            throw new \InvalidArgumentException('The payment deadline is too close to start a secure checkout.');
        }
    }

    public function refundBooking(ConsultationBooking $booking): ?string
    {
        if (! $booking->stripe_payment_intent_id) {
            return null;
        }

        if ($booking->stripe_refund_id) {
            return $booking->stripe_refund_id;
        }

        $refundId = $this->refundPaymentIntent(
            $booking->stripe_payment_intent_id,
            $booking->stripe_refund_idempotency_key ?: 'consultation-booking-'.$booking->id.'-refund',
        );

        $booking->stripe_refund_id = $refundId;
        $booking->stripe_refunded_at = now('UTC');
        $booking->stripe_refund_last_error = null;
        $booking->save();

        return $refundId;
    }

    public function retrieveCheckoutSession(string $sessionId): Session
    {
        if (! $this->configured()) {
            throw new \RuntimeException('Stripe payments are not configured.');
        }

        Stripe::setApiKey(config('stripe.secret'));

        return Session::retrieve($sessionId);
    }

    public function refundPaymentIntent(string $paymentIntentId, ?string $idempotencyKey = null): string
    {
        if (! $this->configured()) {
            throw new \RuntimeException('Stripe refunds are not configured.');
        }

        Stripe::setApiKey(config('stripe.secret'));

        $refund = Refund::create([
            'payment_intent' => $paymentIntentId,
        ], [
            'idempotency_key' => $idempotencyKey ?: 'consultation-refund-'.hash('sha256', $paymentIntentId),
        ]);

        return (string) $refund->id;
    }

    public function constructEvent(string $payload, string $signature): Event
    {
        return Webhook::constructEvent(
            $payload,
            $signature,
            config('stripe.webhook_secret')
        );
    }

    protected function beginAttempt(ConsultationBooking $booking, string $plainToken): ConsultationStripeCheckoutAttempt
    {
        return DB::transaction(function () use ($booking, $plainToken): ConsultationStripeCheckoutAttempt {
            $current = ConsultationBooking::query()->lockForUpdate()->findOrFail($booking->id);
            $this->assertCheckoutAllowed($current);

            if (! $current->stripe_checkout_idempotency_key) {
                $current->stripe_checkout_idempotency_key = 'consultation-checkout-'.$current->id;
                $current->save();
            }

            $attempt = ConsultationStripeCheckoutAttempt::query()
                ->where('idempotency_key', $current->stripe_checkout_idempotency_key)
                ->lockForUpdate()
                ->first();

            if (! $attempt) {
                $attempt = ConsultationStripeCheckoutAttempt::create([
                    'consultation_booking_id' => $current->id,
                    'idempotency_key' => $current->stripe_checkout_idempotency_key,
                    'stripe_checkout_session_id' => $current->stripe_checkout_session_id,
                    // An existing session may have been created before the
                    // attempt ledger existed, so its URL may contain a
                    // different token. Never replace the booking token until
                    // a new session is actually created with this attempt.
                    'access_token' => $current->stripe_checkout_session_id ? '' : $plainToken,
                    'status' => ConsultationStripeCheckoutAttempt::STATUS_PENDING,
                    'next_attempt_at' => now('UTC'),
                ]);
            } elseif (! $current->stripe_checkout_session_id && ! filled($attempt->access_token) && $plainToken !== '') {
                // Preserve the first token used to build an immutable Stripe URL.
                $attempt->access_token = $plainToken;
                $attempt->save();
            }

            if ($attempt->stripe_checkout_session_id === null && $current->stripe_checkout_session_id) {
                $attempt->stripe_checkout_session_id = $current->stripe_checkout_session_id;
                $attempt->save();
            }

            $current->stripe_checkout_attempted_at = now('UTC');
            $current->stripe_checkout_next_attempt_at = null;
            $current->stripe_checkout_last_error = null;
            $current->save();

            $attempt->forceFill([
                'status' => ConsultationStripeCheckoutAttempt::STATUS_PROCESSING,
                'attempts' => $attempt->attempts + 1,
                'last_error' => null,
                'next_attempt_at' => null,
            ])->save();

            return $attempt->fresh();
        });
    }

    protected function markAttemptCreated(ConsultationStripeCheckoutAttempt $attempt, string $sessionId): void
    {
        ConsultationStripeCheckoutAttempt::query()
            ->whereKey($attempt->id)
            ->where('status', ConsultationStripeCheckoutAttempt::STATUS_PROCESSING)
            ->where('attempts', $attempt->attempts)
            ->update([
                'stripe_checkout_session_id' => $sessionId,
                'status' => ConsultationStripeCheckoutAttempt::STATUS_CREATED,
                'last_error' => null,
                'next_attempt_at' => null,
                'completed_at' => now('UTC'),
                'updated_at' => now('UTC'),
            ]);
    }

    protected function bindAttemptSession(ConsultationStripeCheckoutAttempt $attempt, string $sessionId): void
    {
        ConsultationStripeCheckoutAttempt::query()
            ->whereKey($attempt->id)
            ->where('status', ConsultationStripeCheckoutAttempt::STATUS_PROCESSING)
            ->where('attempts', $attempt->attempts)
            ->update([
                'stripe_checkout_session_id' => $sessionId,
                'updated_at' => now('UTC'),
            ]);
    }

    protected function markAttemptFailed(ConsultationStripeCheckoutAttempt $attempt, \Throwable $exception): void
    {
        $delay = min(60 * 24, max(5, 2 ** min($attempt->attempts, 8)));
        $nextAttemptAt = now('UTC')->addMinutes($delay);

        ConsultationStripeCheckoutAttempt::query()
            ->whereKey($attempt->id)
            ->where('status', ConsultationStripeCheckoutAttempt::STATUS_PROCESSING)
            ->where('attempts', $attempt->attempts)
            ->update([
                'status' => ConsultationStripeCheckoutAttempt::STATUS_FAILED,
                'last_error' => mb_substr($exception->getMessage(), 0, 2000),
                'next_attempt_at' => $nextAttemptAt,
                'updated_at' => now('UTC'),
            ]);

        ConsultationBooking::query()
            ->whereKey($attempt->consultation_booking_id)
            ->where('stripe_checkout_idempotency_key', $attempt->idempotency_key)
            ->update([
                'stripe_checkout_last_error' => mb_substr($exception->getMessage(), 0, 2000),
                'stripe_checkout_next_attempt_at' => $nextAttemptAt,
                'updated_at' => now('UTC'),
            ]);
    }

    protected function markAttemptSuperseded(ConsultationStripeCheckoutAttempt $attempt, string $reason): void
    {
        ConsultationStripeCheckoutAttempt::query()
            ->whereKey($attempt->id)
            ->where('status', ConsultationStripeCheckoutAttempt::STATUS_PROCESSING)
            ->where('attempts', $attempt->attempts)
            ->update([
                'status' => ConsultationStripeCheckoutAttempt::STATUS_SUPERSEDED,
                'last_error' => $reason,
                'next_attempt_at' => null,
                'completed_at' => now('UTC'),
                'updated_at' => now('UTC'),
            ]);
    }
}
