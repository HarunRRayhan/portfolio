<?php

namespace App\Mail\Sponsorship;

use Carbon\Carbon;
use Illuminate\Mail\Mailable;

class CreditExpiringMail extends Mailable
{
    public function __construct(public string $name, public Carbon $expiresAt) {}

    public function build()
    {
        return $this->subject('Your consultation credit expires soon')
            ->markdown('emails.sponsorship.credit-expiring', ['url' => route('consultation')]);
    }
}
