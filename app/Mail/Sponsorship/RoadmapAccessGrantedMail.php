<?php

namespace App\Mail\Sponsorship;

use App\Models\RoadmapAccessGrant;
use Illuminate\Mail\Mailable;

class RoadmapAccessGrantedMail extends Mailable
{
    public function __construct(public RoadmapAccessGrant $grant) {}

    public function build()
    {
        return $this->subject('Your roadmap access is unlocked')->markdown('emails.sponsorship.access-granted', [
            'until' => $this->grant->expires_at->year >= 2099 ? null : $this->grant->expires_at->format('M j, Y'),
            'email' => $this->grant->email,
            'xp' => (int) $this->grant->amount_cents,
            'url' => url('/roadmaps'),
        ]);
    }
}
