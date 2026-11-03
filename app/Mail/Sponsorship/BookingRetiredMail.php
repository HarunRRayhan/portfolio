<?php

namespace App\Mail\Sponsorship;

use Illuminate\Mail\Mailable;

class BookingRetiredMail extends Mailable
{
    public function __construct(public string $name) {}

    public function build()
    {
        return $this->subject('Your consultation request was closed')
            ->markdown('emails.sponsorship.booking-retired', ['url' => route('consultation')]);
    }
}
