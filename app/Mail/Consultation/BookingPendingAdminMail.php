<?php

namespace App\Mail\Consultation;

class BookingPendingAdminMail extends BookingMailable
{
    public function build()
    {
        return $this->subject('New consultation request: '.$this->booking->tier->name)
            ->markdown('emails.consultation.pending-admin');
    }
}
