<?php

namespace App\Mail;

use Illuminate\Mail\Mailable;
use Illuminate\Support\Carbon;

class AccountDeletionScheduledMail extends Mailable
{
    public function __construct(public string $purgesOn) {}

    public function build()
    {
        return $this->subject('Your '.config('app.name').' account is scheduled for deletion')
            ->markdown('emails.auth.account-deletion-scheduled', [
                'date' => Carbon::parse($this->purgesOn)->format('F j, Y'),
                'url' => route('login'),
            ]);
    }
}
