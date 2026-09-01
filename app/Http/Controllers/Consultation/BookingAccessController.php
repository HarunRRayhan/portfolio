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
    public function show(Request $request, string $publicId, BookingWorkflowService $workflow): Response|RedirectResponse
    {
        $booking = ConsultationBooking::query()->where('public_id', $publicId)->firstOrFail();
        $token = (string) $request->query('token', '');

        if ($token !== '') {
            $workflow->assertAccessToken($booking, $token);
            $request->session()->put($this->accessSessionKey($publicId), hash('sha256', $token));

            $query = [];
            if ($request->boolean('paid')) {
                $query['paid'] = 1;
            }
            if ($request->boolean('cancelled_checkout')) {
                $query['cancelled_checkout'] = 1;
            }

            $cleanUrl = route('book.status', ['publicId' => $publicId]);
            if ($query) {
                $cleanUrl .= '?'.http_build_query($query);
            }

            return redirect()->to($cleanUrl);
        }

        $workflow->assertAccessTokenHash($booking, $request->session()->get($this->accessSessionKey($publicId)));

        return Inertia::render('Book/Status', [
            'booking' => $booking->toClientArray(),
            'flashPaid' => $request->boolean('paid'),
            'flashCancelledCheckout' => $request->boolean('cancelled_checkout'),
        ]);
    }

    public function pay(Request $request, string $publicId, BookingWorkflowService $workflow, StripeCheckoutService $stripe): RedirectResponse
    {
        $booking = ConsultationBooking::query()->where('public_id', $publicId)->firstOrFail();
        $token = (string) $request->input('token', $request->query('token', ''));
        $this->authorizeBookingAccess($request, $booking, $publicId, $token, $workflow);

        if ($booking->status !== ConsultationBooking::STATUS_AWAITING_PAYMENT) {
            return back()->with('flash', ['type' => 'error', 'message' => 'This booking is not awaiting payment.']);
        }

        try {
            $url = $stripe->createCheckoutUrl($booking, $token);
        } catch (\InvalidArgumentException $e) {
            return back()->with('flash', ['type' => 'error', 'message' => $e->getMessage()]);
        } catch (\Throwable) {
            return back()->with('flash', ['type' => 'error', 'message' => 'Payment is temporarily unavailable. Please try again.']);
        }

        if (! $url) {
            return back()->with('flash', ['type' => 'error', 'message' => 'Payment is not configured yet.']);
        }

        return redirect()->away($url);
    }

    public function requestCancel(Request $request, string $publicId, BookingWorkflowService $workflow): RedirectResponse
    {
        $booking = ConsultationBooking::query()->where('public_id', $publicId)->firstOrFail();
        $token = (string) $request->input('token');
        $this->authorizeBookingAccess($request, $booking, $publicId, $token, $workflow);

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
        $this->authorizeBookingAccess($request, $booking, $publicId, $token, $workflow);

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
        $this->authorizeBookingAccess($request, $booking, $publicId, $token, $workflow);

        $data = $request->validate([
            'starts_at' => ['required', 'date'],
        ]);

        try {
            $workflow->clientPickProposedSlot($booking, Carbon::parse($data['starts_at'])->utc());
        } catch (\InvalidArgumentException $e) {
            return back()->with('flash', ['type' => 'error', 'message' => $e->getMessage()]);
        } catch (\RuntimeException) {
            return back()->with('flash', ['type' => 'error', 'message' => 'That time is temporarily unavailable. Please try again.']);
        }

        return back()->with('flash', ['type' => 'success', 'message' => 'New time submitted for approval.']);
    }

    protected function authorizeBookingAccess(
        Request $request,
        ConsultationBooking $booking,
        string $publicId,
        string $token,
        BookingWorkflowService $workflow,
    ): void {
        if ($token !== '') {
            $workflow->assertAccessToken($booking, $token);
            $request->session()->put($this->accessSessionKey($publicId), hash('sha256', $token));

            return;
        }

        $workflow->assertAccessTokenHash($booking, $request->session()->get($this->accessSessionKey($publicId)));
    }

    protected function accessSessionKey(string $publicId): string
    {
        return 'consultation.access.'.$publicId;
    }
}
