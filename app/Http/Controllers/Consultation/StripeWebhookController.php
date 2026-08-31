<?php

namespace App\Http\Controllers\Consultation;

use App\Http\Controllers\Controller;
use App\Models\ConsultationBooking;
use App\Services\Consultation\BookingWorkflowService;
use App\Services\Consultation\StripeCheckoutService;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Log;
use Stripe\Checkout\Session;

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

        if ($event->type === 'checkout.session.completed') {
            /** @var Session $session */
            $session = $event->data->object;
            $publicId = $session->client_reference_id
                ?: ($session->metadata['booking_public_id'] ?? null);

            if ($publicId) {
                $booking = ConsultationBooking::query()->where('public_id', $publicId)->first();

                if ($booking) {
                    try {
                        $workflow->markPaidFromStripe(
                            $booking,
                            $session->id,
                            is_string($session->payment_intent) ? $session->payment_intent : ($session->payment_intent->id ?? null),
                        );
                    } catch (\Throwable $e) {
                        Log::error('Stripe booking confirm failed', [
                            'booking' => $publicId,
                            'error' => $e->getMessage(),
                        ]);
                    }
                }
            }
        }

        return response('ok', 200);
    }
}
