<?php

namespace App\Mail\Consultation;

class BookingCancelledMail extends BookingMailable
{
    public function build()
    {
        return $this->subject('Consultation cancelled')
            ->markdown('emails.consultation.cancelled');
    }
}
