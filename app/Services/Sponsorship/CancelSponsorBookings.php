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
        return $this->cancelBookings($this->credits->endSponsorship($s, $status));
    }

    /** Run outside any transaction: calendar deletes and client mails can't roll back. */
    public function cancelBookings(iterable $bookings): int
    {
        $count = 0;

        foreach ($bookings as $booking) {
            try {
                $this->workflow->cancelForSponsorEnd($booking);
                $count++;
            } catch (\Throwable $e) {
                Log::error('Sponsor-end booking cancel failed', ['booking' => $booking->id, 'error' => $e->getMessage()]);
                try {
                    Mail::to(config('mail.owner.address'))->send(new SponsorCancelFailedMail($booking->public_id, $e->getMessage()));
                } catch (\Throwable $mailError) {
                    Log::error('Sponsor-end cancel failure mail failed', ['booking' => $booking->id, 'error' => $mailError->getMessage()]);
                }
            }
        }

        return $count;
    }
}
