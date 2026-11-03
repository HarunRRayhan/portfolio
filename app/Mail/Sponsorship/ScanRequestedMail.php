<?php

namespace App\Mail\Sponsorship;

use Illuminate\Mail\Mailable;

class ScanRequestedMail extends Mailable
{
    public function __construct(
        public string $userName,
        public string $userEmail,
        public string $repoUrl,
        public ?string $notes = null,
    ) {}

    public function build()
    {
        return $this->subject('Open-source scan requested')
            ->markdown('emails.sponsorship.scan-requested');
    }
}
