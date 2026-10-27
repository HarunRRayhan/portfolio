<?php

namespace App\Mail;

use Illuminate\Mail\Mailable;

class SocialProviderLinkedMail extends Mailable
{
    public function __construct(public string $provider) {}

    public function build()
    {
        return $this->subject(ucfirst($this->provider).' was linked to your '.config('app.name').' account')
            ->markdown('emails.auth.social-provider-linked', [
                'provider' => ucfirst($this->provider),
                'url' => route('login'),
            ]);
    }
}
