<?php

namespace App\Http\Controllers\Admin\Consultation;

use App\Http\Controllers\Controller;
use App\Models\ConsultationBooking;
use App\Services\Consultation\AvailabilityService;
use App\Services\Consultation\BookingWorkflowService;
use App\Services\Consultation\GoogleCalendarService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class BookingController extends Controller
{
    public function index(Request $request): Response
    {
        $status = $request->string('status')->toString();

        $query = ConsultationBooking::query()->with(['tier', 'coupon'])->latest();

        if ($status !== '') {
            $query->where('status', $status);
        }

        return Inertia::render('Admin/Consultations/Bookings/Index', [
            'bookings' => $query->limit(100)->get()->map->toAdminArray()->values(),
            'filterStatus' => $status,
            'googleConnected' => app(GoogleCalendarService::class)->isConnected(),
        ]);
    }

    public function show(ConsultationBooking $booking, AvailabilityService $availability): Response
    {
        $booking->load(['tier', 'coupon', 'events']);

        return Inertia::render('Admin/Consultations/Bookings/Show', [
            'booking' => $booking->toAdminArray(),
            'events' => $booking->events()->latest()->limit(50)->get()->map(fn ($e) => [
                'id' => $e->id,
                'event' => $e->event,
                'actor' => $e->actor,
                'meta' => $e->meta,
                'created_at' => $e->created_at?->utc()->toIso8601String(),
            ]),
            'slots' => $availability->availableSlots($booking->tier, null, null, $booking->id),
            'googleConnected' => app(GoogleCalendarService::class)->isConnected(),
        ]);
    }

    public function approve(Request $request, ConsultationBooking $booking, BookingWorkflowService $workflow): RedirectResponse
    {
        $data = $request->validate(['admin_note' => ['nullable', 'string', 'max:2000']]);

        try {
            $workflow->approve($booking, $data['admin_note'] ?? null);
        } catch (\InvalidArgumentException $e) {
            return back()->with('flash', ['type' => 'error', 'message' => $e->getMessage()]);
        }

        return back()->with('flash', ['type' => 'success', 'message' => 'Booking approved.']);
    }

    public function decline(Request $request, ConsultationBooking $booking, BookingWorkflowService $workflow): RedirectResponse
    {
        $data = $request->validate([
            'block_slot' => ['sometimes', 'boolean'],
            'task_title' => ['nullable', 'string', 'max:200'],
            'admin_note' => ['nullable', 'string', 'max:2000'],
        ]);

        try {
            $workflow->decline(
                $booking,
                (bool) ($data['block_slot'] ?? false),
                $data['task_title'] ?? null,
                $data['admin_note'] ?? null,
            );
        } catch (\InvalidArgumentException $e) {
            return back()->with('flash', ['type' => 'error', 'message' => $e->getMessage()]);
        }

        return back()->with('flash', ['type' => 'success', 'message' => 'Booking declined.']);
    }

    public function proposeReschedule(Request $request, ConsultationBooking $booking, BookingWorkflowService $workflow): RedirectResponse
    {
        $data = $request->validate([
            'slots' => ['required', 'array', 'min:1'],
            'slots.*.start' => ['required', 'date'],
            'slots.*.end' => ['required', 'date'],
            'admin_note' => ['nullable', 'string', 'max:2000'],
        ]);

        try {
            $workflow->proposeReschedule($booking, $data['slots'], $data['admin_note'] ?? null);
        } catch (\InvalidArgumentException $e) {
            return back()->with('flash', ['type' => 'error', 'message' => $e->getMessage()]);
        }

        return back()->with('flash', ['type' => 'success', 'message' => 'Reschedule options sent to client.']);
    }

    public function approveCancel(ConsultationBooking $booking, BookingWorkflowService $workflow): RedirectResponse
    {
        try {
            $workflow->approveCancel($booking);
        } catch (\InvalidArgumentException $e) {
            return back()->with('flash', ['type' => 'error', 'message' => $e->getMessage()]);
        }

        return back()->with('flash', ['type' => 'success', 'message' => 'Cancellation approved.']);
    }

    public function denyCancel(ConsultationBooking $booking, BookingWorkflowService $workflow): RedirectResponse
    {
        try {
            $workflow->denyCancel($booking);
        } catch (\InvalidArgumentException $e) {
            return back()->with('flash', ['type' => 'error', 'message' => $e->getMessage()]);
        }

        return back()->with('flash', ['type' => 'success', 'message' => 'Cancel request denied.']);
    }

    public function denyReschedule(ConsultationBooking $booking, BookingWorkflowService $workflow): RedirectResponse
    {
        try {
            $workflow->denyReschedule($booking);
        } catch (\InvalidArgumentException $e) {
            return back()->with('flash', ['type' => 'error', 'message' => $e->getMessage()]);
        }

        return back()->with('flash', ['type' => 'success', 'message' => 'Reschedule request denied.']);
    }
}
