<?php

namespace App\Mail\Consultation;

use App\Models\ConsultationBooking;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

abstract class BookingMailable extends Mailable
{
    use SerializesModels;

    public function __construct(
        public ConsultationBooking $booking,
        public ?string $plainToken = null,
    ) {
        $this->booking->loadMissing('tier');
    }

    protected function bookingUrl(): ?string
    {
        if (! $this->plainToken) {
            return null;
        }

        return $this->booking->accessUrl($this->plainToken);
    }
}
