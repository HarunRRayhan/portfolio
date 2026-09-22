<?php

namespace App\Http\Controllers;

use App\Services\Sponsorship\SponsorCheckoutService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

class SponsorCheckoutController extends Controller
{
    public function store(Request $request, SponsorCheckoutService $checkout): Response
    {
        $minimum = number_format((int) config('sponsor.min_amount_cents', 100) / 100, 2, '.', '');
        $maximum = number_format((int) config('sponsor.max_amount_cents', 100_000_000) / 100, 2, '.', '');

        $data = $request->validate([
            'amount' => ['required', 'numeric', 'decimal:0,2', "min:{$minimum}", "max:{$maximum}"],
            'cadence' => ['required', Rule::in([
                SponsorCheckoutService::CADENCE_ONCE,
                SponsorCheckoutService::CADENCE_MONTHLY,
            ])],
        ]);

        if (! $checkout->configured()) {
            return back()->withErrors([
                'checkout' => 'Checkout is temporarily unavailable. Please try again later.',
            ])->withInput();
        }

        try {
            $checkoutUrl = $checkout->createCheckoutUrl((string) $data['amount'], (string) $data['cadence']);
        } catch (\Throwable $exception) {
            Log::error('Could not create sponsor Stripe checkout session', [
                'cadence' => $data['cadence'],
                'exception' => $exception::class,
            ]);

            return back()->withErrors([
                'checkout' => 'Checkout could not be started. Please try again later.',
            ])->withInput();
        }

        return Inertia::location($checkoutUrl);
    }
}
