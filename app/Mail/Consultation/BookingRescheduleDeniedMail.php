<?php

namespace App\Mail\Consultation;

class BookingRescheduleDeniedMail extends BookingMailable
{
    public function build()
    {
        return $this->subject('Your consultation reschedule request')
            ->markdown('emails.consultation.reschedule-denied');
    }
}
