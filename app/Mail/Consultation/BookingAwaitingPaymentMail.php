<?php

namespace App\Mail\Consultation;

use App\Models\ConsultationBooking;

class BookingAwaitingPaymentMail extends BookingMailable
{
    public function __construct(
        ConsultationBooking $booking,
        ?string $plainToken,
        public ?string $checkoutUrl,
    ) {
        parent::__construct($booking, $plainToken);
    }

    public function build()
    {
        return $this->subject('Your consultation is approved — complete payment')
            ->markdown('emails.consultation.awaiting-payment', [
                'bookingUrl' => $this->bookingUrl(),
                'checkoutUrl' => $this->checkoutUrl,
            ]);
    }
}
