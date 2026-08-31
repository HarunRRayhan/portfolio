<?php

namespace App\Mail\Consultation;

class BookingDeclinedMail extends BookingMailable
{
    public function build()
    {
        return $this->subject('Update on your consultation request')
            ->markdown('emails.consultation.declined');
    }
}
