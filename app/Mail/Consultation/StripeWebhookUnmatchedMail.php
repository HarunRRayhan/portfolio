<?php

namespace App\Mail\Consultation;

use Illuminate\Mail\Mailable;

class StripeWebhookUnmatchedMail extends Mailable
{
    public function __construct(
        public string $eventId,
        public string $eventType,
        public string $reason,
        public ?string $sessionId = null,
        public ?string $bookingPublicId = null,
    ) {}

    public function build()
    {
        return $this->subject('Unmatched Stripe consultation webhook')
            ->markdown('emails.consultation.stripe-webhook-unmatched');
    }
}
