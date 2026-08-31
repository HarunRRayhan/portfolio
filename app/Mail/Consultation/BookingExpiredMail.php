<?php

namespace App\Mail\Consultation;

class BookingExpiredMail extends BookingMailable
{
    public function build()
    {
        return $this->subject('Your consultation request expired')
            ->markdown('emails.consultation.expired');
    }
}
