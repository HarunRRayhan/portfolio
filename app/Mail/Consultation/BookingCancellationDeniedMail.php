<?php

namespace App\Mail\Consultation;

class BookingCancellationDeniedMail extends BookingMailable
{
    public function build()
    {
        return $this->subject('Your consultation is still scheduled')
            ->markdown('emails.consultation.cancel-denied');
    }
}
