<?php

namespace App\Mail\Sponsorship;

use Illuminate\Mail\Mailable;

class SponsorCancelFailedMail extends Mailable
{
    public function __construct(public string $bookingPublicId, public string $error) {}

    public function build()
    {
        return $this->subject('Sponsor ended: booking cancel failed')
            ->markdown('emails.sponsorship.cancel-failed');
    }
}
