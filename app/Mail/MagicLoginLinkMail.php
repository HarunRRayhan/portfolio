<?php

namespace App\Mail;

use Illuminate\Mail\Mailable;

class MagicLoginLinkMail extends Mailable
{
    public function __construct(public string $url) {}

    public function build()
    {
        return $this->subject('Your sign-in link for '.config('app.name'))
            ->markdown('emails.auth.magic-link', ['url' => $this->url]);
    }
}
