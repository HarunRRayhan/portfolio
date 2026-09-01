<?php

namespace App\Services\Consultation;

use App\Models\ConsultationBooking;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
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

        $expiredSessionId = null;

        if ($booking->stripe_checkout_session_id) {
            try {
                $existing = Session::retrieve($booking->stripe_checkout_session_id);
                $status = (string) ($existing->status ?? '');

                if (in_array($status, ['open', 'complete'], true) && filled($existing->url)) {
                    return $existing->url;
                }

                if (($existing->payment_status ?? null) === 'paid') {
                    return $existing->url;
                }

                if ($status !== 'expired') {
                    throw new \RuntimeException('The existing Stripe checkout session is not available.');
                }
            } catch (InvalidRequestException $e) {
                if ($e->getStripeCode() !== 'resource_missing') {
                    throw new \RuntimeException('The existing Stripe checkout session could not be checked.', 0, $e);
                }
            } catch (\RuntimeException $e) {
                throw $e;
            } catch (\Throwable $e) {
                Log::warning('Could not inspect existing Stripe checkout session', [
                    'booking' => $booking->public_id,
                    'session' => $booking->stripe_checkout_session_id,
                    'error' => $e->getMessage(),
                ]);

                throw new \RuntimeException('The existing Stripe checkout session could not be checked.', 0, $e);
            }

            $expiredSessionId = $booking->stripe_checkout_session_id;
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

            if ($booking->stripe_checkout_session_id && $booking->stripe_checkout_session_id !== $expiredSessionId) {
                try {
                    $existing = Session::retrieve($booking->stripe_checkout_session_id);

                    if (filled($existing->url)) {
                        return $existing->url;
                    }
                } catch (\Throwable $e) {
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

        $statusUrl = url('/book/b/'.$booking->public_id);
        $success = $statusUrl.'?'.http_build_query(array_filter([
            'token' => $plainToken !== '' ? $plainToken : null,
            'paid' => 1,
        ], fn ($value): bool => $value !== null));
        $cancel = $statusUrl.'?'.http_build_query(array_filter([
            'token' => $plainToken !== '' ? $plainToken : null,
            'cancelled_checkout' => 1,
        ], fn ($value): bool => $value !== null));

        $now = now('UTC');
        $expiresAt = $now->copy()->addHours(23);
        if ($booking->payment_due_at && $booking->payment_due_at->lessThan($expiresAt)) {
            $expiresAt = $booking->payment_due_at->copy();
        }

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

        DB::transaction(function () use ($booking, $session) {
            $current = ConsultationBooking::query()
                ->lockForUpdate()
                ->findOrFail($booking->id);

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
            $current->save();
        });

        return $session->url;
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
        $booking->save();

        return $refundId;
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
}
