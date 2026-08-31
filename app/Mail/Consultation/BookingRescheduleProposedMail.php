<?php

namespace App\Mail\Consultation;

class BookingRescheduleProposedMail extends BookingMailable
{
    public function build()
    {
        return $this->subject('Pick a new time for your consultation')
            ->markdown('emails.consultation.reschedule-proposed', [
                'bookingUrl' => $this->bookingUrl(),
            ]);
    }
}
