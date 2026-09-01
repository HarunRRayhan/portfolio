<?php

namespace App\Services\Consultation;

use App\Models\ConsultationBooking;
use App\Models\ConsultationStripeCheckoutAttempt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Stripe\Checkout\Session;

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

        if ($booking->stripe_checkout_session_id) {
            $session = $this->stripe->retrieveCheckoutSession($booking->stripe_checkout_session_id);
            $this->markCheckoutChecked($booking);

            if ($booking->status === ConsultationBooking::STATUS_EXPIRED) {
                if ($this->isPaid($session)) {
                    $this->assertSessionMatchesBooking($booking, $session);
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

            if (($session->status ?? null) !== 'expired' && filled($session->url)) {
                $token = $this->checkoutToken($booking);
                $booking = $this->persistAccessToken($booking, $token);
                $this->queuePaymentMail($booking, $token, (string) $session->url, (string) $session->id);

                return true;
            }
        }

        $token = $this->checkoutToken($booking);
        $checkoutUrl = $this->stripe->createCheckoutUrl($booking, $token);
        if (! $checkoutUrl) {
            return false;
        }

        $booking = DB::transaction(function () use ($booking, $token): ConsultationBooking {
            $current = ConsultationBooking::query()->lockForUpdate()->findOrFail($booking->id);

            if ($current->status !== ConsultationBooking::STATUS_AWAITING_PAYMENT) {
                return $current;
            }

            $current->access_token_hash = hash('sha256', $token);
            $current->access_token_expires_at = $current->ends_at?->copy()->addDays((int) config('consultation.access_token_days', 90));
            $current->stripe_checkout_last_error = null;
            $current->stripe_checkout_next_attempt_at = null;
            $current->save();

            return $current->fresh(['tier']);
        });

        if ($booking->status !== ConsultationBooking::STATUS_AWAITING_PAYMENT || ! $booking->stripe_checkout_session_id) {
            return false;
        }

        $this->queuePaymentMail($booking, $token, $checkoutUrl, $booking->stripe_checkout_session_id);

        return true;
    }

    protected function checkoutToken(ConsultationBooking $booking): string
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

        return Str::random(48);
    }

    protected function persistAccessToken(ConsultationBooking $booking, string $token): ConsultationBooking
    {
        return DB::transaction(function () use ($booking, $token): ConsultationBooking {
            $current = ConsultationBooking::query()->lockForUpdate()->findOrFail($booking->id);

            if ($current->status === ConsultationBooking::STATUS_AWAITING_PAYMENT) {
                $current->access_token_hash = hash('sha256', $token);
                $current->access_token_expires_at = $current->ends_at?->copy()->addDays((int) config('consultation.access_token_days', 90));
                $current->save();
            }

            return $current->fresh(['tier']);
        });
    }

    protected function queuePaymentMail(
        ConsultationBooking $booking,
        string $token,
        string $checkoutUrl,
        string $sessionId,
    ): void {
        $booking = $booking->fresh(['tier']);
        $this->notifications->enqueue(
            $booking,
            $booking->client_email,
            ConsultationNotificationService::TYPE_AWAITING_PAYMENT,
            [
                'plain_token' => $token,
                'checkout_url' => $checkoutUrl,
            ],
            'consultation-booking-'.$booking->id.'-awaiting-payment-'.$sessionId,
        );
        $this->notifications->deliverDueForBooking($booking->id);
    }

    protected function isPaid(Session $session): bool
    {
        return in_array((string) ($session->payment_status ?? ''), ['paid', 'no_payment_required'], true);
    }

    protected function paymentIntentId(Session $session): ?string
    {
        $paymentIntent = $session->payment_intent;

        return is_string($paymentIntent)
            ? $paymentIntent
            : (is_object($paymentIntent) ? ($paymentIntent->id ?? null) : null);
    }

    protected function assertSessionMatchesBooking(ConsultationBooking $booking, Session $session): void
    {
        if ($booking->amount_due_cents > 0 && $session->payment_status !== 'paid') {
            $this->refundRejectedPayment($session, 'payment was not marked paid', $booking);
            throw new \InvalidArgumentException('Stripe payment was rejected: payment was not marked paid.');
        }

        if ($booking->amount_due_cents > 0 && $session->amount_total === null) {
            throw new \RuntimeException('Stripe session amount was missing.');
        }

        if ($booking->amount_due_cents > 0 && (int) $session->amount_total !== $booking->amount_due_cents) {
            $this->refundRejectedPayment($session, 'unexpected amount', $booking);
            throw new \InvalidArgumentException('Stripe payment was rejected: unexpected amount.');
        }

        if ($booking->amount_due_cents > 0 && ! $this->paymentIntentId($session)) {
            throw new \RuntimeException('Stripe payment intent was missing.');
        }

        if (! $session->currency && $booking->amount_due_cents > 0) {
            throw new \RuntimeException('Stripe session currency was missing.');
        }

        if ($session->currency && strtolower((string) $session->currency) !== strtolower($booking->currency)) {
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
