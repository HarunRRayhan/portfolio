<?php

namespace App\Services\Consultation;

use App\Models\ConsultationBooking;
use Stripe\Checkout\Session;
use Stripe\Event;
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

        $success = url('/book/b/'.$booking->public_id.'?token='.urlencode($plainToken).'&paid=1');
        $cancel = url('/book/b/'.$booking->public_id.'?token='.urlencode($plainToken).'&cancelled_checkout=1');

        $expiresAt = now()->addHours(23);
        if ($booking->payment_due_at && $booking->payment_due_at->lessThan($expiresAt)) {
            $expiresAt = $booking->payment_due_at->copy();
        }
        if ($expiresAt->lessThan(now()->addMinutes(31))) {
            $expiresAt = now()->addMinutes(31);
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
        ]);

        $booking->stripe_checkout_session_id = $session->id;
        $booking->save();

        return $session->url;
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
