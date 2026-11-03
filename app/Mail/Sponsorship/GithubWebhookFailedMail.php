<?php

namespace App\Mail\Sponsorship;

use Illuminate\Mail\Mailable;

class GithubWebhookFailedMail extends Mailable
{
    public function __construct(public string $deliveryId, public string $error) {}

    public function build()
    {
        return $this->subject('GitHub Sponsors webhook failed')
            ->markdown('emails.sponsorship.webhook-failed');
    }
}
