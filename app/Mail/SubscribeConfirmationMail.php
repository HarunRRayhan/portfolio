<?php

namespace App\Mail;

use Illuminate\Mail\Mailable;

class SubscribeConfirmationMail extends Mailable
{
    public function __construct(public string $url) {}

    public function build()
    {
        return $this->subject('Confirm your subscription to '.config('app.name'))
            ->markdown('emails.newsletter.confirm', ['url' => $this->url]);
    }
}
