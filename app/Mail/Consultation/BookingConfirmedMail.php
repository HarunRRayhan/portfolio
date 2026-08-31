<?php

namespace App\Mail\Consultation;

class BookingConfirmedMail extends BookingMailable
{
    public function build()
    {
        return $this->subject('Consultation confirmed')
            ->markdown('emails.consultation.confirmed', [
                'bookingUrl' => $this->bookingUrl(),
            ]);
    }
}
