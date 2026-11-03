<?php

namespace App\Mail\Sponsorship;

use Carbon\Carbon;
use Illuminate\Mail\Mailable;

class SponsorCreditsReadyMail extends Mailable
{
    public function __construct(public string $name, public ?Carbon $expiresAt = null) {}

    public function build()
    {
        return $this->subject('Your consultation credits are ready')
            ->markdown('emails.sponsorship.credits-ready', ['url' => route('consultation')]);
    }
}
