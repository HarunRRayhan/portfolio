<?php

namespace App\Services\Sponsorship;

use App\Mail\Sponsorship\SponsorCancelFailedMail;
use App\Models\GithubSponsorship;
use App\Services\Consultation\BookingWorkflowService;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class CancelSponsorBookings
{
    public function __construct(
        private SponsorCreditService $credits,
        private BookingWorkflowService $workflow,
    ) {}

    /** Ends the sponsorship and cancels its future bookings; returns how many were cancelled. */
    public function __invoke(GithubSponsorship $s, string $status): int
    {
        $count = 0;

        foreach ($this->credits->endSponsorship($s, $status) as $booking) {
            try {
                $this->workflow->cancelForSponsorEnd($booking);
                $count++;
            } catch (\Throwable $e) {
                Log::error('Sponsor-end booking cancel failed', ['booking' => $booking->id, 'error' => $e->getMessage()]);
                Mail::to(config('mail.owner.address'))->send(new SponsorCancelFailedMail($booking->public_id, $e->getMessage()));
            }
        }

        return $count;
    }
}
