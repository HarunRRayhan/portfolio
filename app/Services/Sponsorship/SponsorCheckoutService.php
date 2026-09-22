<?php

namespace App\Services\Sponsorship;

use Illuminate\Support\Str;
use Stripe\Checkout\Session;
use Stripe\Stripe;

class SponsorCheckoutService
{
    public const CADENCE_ONCE = 'once';

    public const CADENCE_MONTHLY = 'monthly';

    public function configured(): bool
    {
        return filled(config('sponsor.stripe_secret'));
    }

    public function createCheckoutUrl(string $amount, string $cadence): string
    {
        if (! $this->configured()) {
            throw new \RuntimeException('Stripe sponsorship checkout is not configured.');
        }

        $amountCents = $this->amountToCents($amount);
        $isMonthly = $cadence === self::CADENCE_MONTHLY;

        if (! in_array($cadence, [self::CADENCE_ONCE, self::CADENCE_MONTHLY], true)) {
            throw new \InvalidArgumentException('The sponsorship cadence is invalid.');
        }

        Stripe::setApiKey(config('sponsor.stripe_secret'));

        $reference = 'sponsor-'.Str::uuid()->toString();
        $priceData = [
            'currency' => config('sponsor.currency', 'usd'),
            'unit_amount' => $amountCents,
            'product_data' => [
                'name' => $isMonthly ? 'Monthly support for Harun\'s work' : 'Support Harun\'s work',
                'description' => $isMonthly
                    ? 'A monthly contribution toward independent technical writing and tools.'
                    : 'A one-time contribution toward independent technical writing and tools.',
            ],
        ];

        if ($isMonthly) {
            $priceData['recurring'] = [
                'interval' => 'month',
            ];
        }

        $session = Session::create([
            'mode' => $isMonthly ? 'subscription' : 'payment',
            'success_url' => route('sponsor', ['checkout' => 'success']),
            'cancel_url' => route('sponsor', ['checkout' => 'cancelled']),
            'client_reference_id' => $reference,
            'metadata' => [
                'sponsorship_cadence' => $cadence,
                'sponsorship_amount_cents' => (string) $amountCents,
            ],
            'submit_type' => $isMonthly ? 'subscribe' : 'donate',
            'line_items' => [[
                'quantity' => 1,
                'price_data' => $priceData,
            ]],
        ], [
            'idempotency_key' => $reference,
        ]);

        if (! filled($session->url)) {
            throw new \RuntimeException('Stripe did not return a checkout URL.');
        }

        return (string) $session->url;
    }

    public function amountToCents(string $amount): int
    {
        $amount = trim($amount);

        if (! preg_match('/^\d+(?:\.\d{1,2})?$/', $amount)) {
            throw new \InvalidArgumentException('The sponsorship amount is invalid.');
        }

        [$whole, $fraction] = array_pad(explode('.', $amount, 2), 2, '');
        $amountCents = ((int) $whole * 100) + (int) str_pad($fraction, 2, '0');

        if (
            $amountCents < (int) config('sponsor.min_amount_cents', 100)
            || $amountCents > (int) config('sponsor.max_amount_cents', 100_000_000)
        ) {
            throw new \InvalidArgumentException('The sponsorship amount is outside the allowed range.');
        }

        return $amountCents;
    }
}
