<?php

namespace App\Http\Controllers\Consultation;

use App\Http\Controllers\Controller;
use App\Models\ConsultationBooking;
use App\Services\Consultation\BookingWorkflowService;
use App\Services\Consultation\StripeCheckoutService;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class BookingAccessController extends Controller
{
    public function show(Request $request, string $publicId, BookingWorkflowService $workflow): Response
    {
        $booking = ConsultationBooking::query()->where('public_id', $publicId)->firstOrFail();
        $token = (string) $request->query('token', '');
        $workflow->assertAccessToken($booking, $token);

        return Inertia::render('Book/Status', [
            'booking' => $booking->toClientArray(),
            'token' => $token,
            'flashPaid' => $request->boolean('paid'),
            'flashCancelledCheckout' => $request->boolean('cancelled_checkout'),
        ]);
    }

    public function pay(Request $request, string $publicId, BookingWorkflowService $workflow, StripeCheckoutService $stripe): RedirectResponse
    {
        $booking = ConsultationBooking::query()->where('public_id', $publicId)->firstOrFail();
        $token = (string) $request->input('token', $request->query('token', ''));
        $workflow->assertAccessToken($booking, $token);

        if ($booking->status !== ConsultationBooking::STATUS_AWAITING_PAYMENT) {
            return back()->with('flash', ['type' => 'error', 'message' => 'This booking is not awaiting payment.']);
        }

        $url = $stripe->createCheckoutUrl($booking, $token);

        if (! $url) {
            return back()->with('flash', ['type' => 'error', 'message' => 'Payment is not configured yet.']);
        }

        return redirect()->away($url);
    }

    public function requestCancel(Request $request, string $publicId, BookingWorkflowService $workflow): RedirectResponse
    {
        $booking = ConsultationBooking::query()->where('public_id', $publicId)->firstOrFail();
        $token = (string) $request->input('token');
        $workflow->assertAccessToken($booking, $token);

        try {
            $workflow->requestCancel($booking);
        } catch (\InvalidArgumentException $e) {
            return back()->with('flash', ['type' => 'error', 'message' => $e->getMessage()]);
        }

        return back()->with('flash', ['type' => 'success', 'message' => 'Cancel request sent for review.']);
    }

    public function requestReschedule(Request $request, string $publicId, BookingWorkflowService $workflow): RedirectResponse
    {
        $booking = ConsultationBooking::query()->where('public_id', $publicId)->firstOrFail();
        $token = (string) $request->input('token');
        $workflow->assertAccessToken($booking, $token);

        $data = $request->validate([
            'note' => ['nullable', 'string', 'max:2000'],
        ]);

        try {
            $workflow->requestReschedule($booking, $data['note'] ?? null);
        } catch (\InvalidArgumentException $e) {
            return back()->with('flash', ['type' => 'error', 'message' => $e->getMessage()]);
        }

        return back()->with('flash', ['type' => 'success', 'message' => 'Reschedule request sent for review.']);
    }

    public function pickProposed(Request $request, string $publicId, BookingWorkflowService $workflow): RedirectResponse
    {
        $booking = ConsultationBooking::query()->where('public_id', $publicId)->firstOrFail();
        $token = (string) $request->input('token');
        $workflow->assertAccessToken($booking, $token);

        $data = $request->validate([
            'starts_at' => ['required', 'date'],
        ]);

        try {
            $workflow->clientPickProposedSlot($booking, Carbon::parse($data['starts_at'])->utc());
        } catch (\InvalidArgumentException $e) {
            return back()->with('flash', ['type' => 'error', 'message' => $e->getMessage()]);
        }

        return back()->with('flash', ['type' => 'success', 'message' => 'New time submitted for approval.']);
    }
}
