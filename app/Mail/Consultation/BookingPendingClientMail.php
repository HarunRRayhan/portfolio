<?php

namespace App\Mail\Consultation;

class BookingPendingClientMail extends BookingMailable
{
    public function build()
    {
        return $this->subject('We received your consultation request')
            ->markdown('emails.consultation.pending-client', [
                'bookingUrl' => $this->bookingUrl(),
            ]);
    }
}
