<?php

namespace App\Mail;

use App\Models\Subscriber;
use App\Models\User;
use Illuminate\Mail\Mailable;
use Illuminate\Support\Facades\URL;

class RoadmapProgressMail extends Mailable
{
    /** @param  array<string, mixed>  $digest */
    public function __construct(public User $user, public Subscriber $subscriber, public array $digest) {}

    public function build()
    {
        $d = $this->digest;
        $subject = $d['idle']
            ? 'Pick up your roadmap where you left off'
            : sprintf('Your week: %d lesson%s, %d XP', $d['lessonsWeek'], $d['lessonsWeek'] === 1 ? '' : 's', $d['xpWeek']);
        $data = [
            'name' => explode(' ', trim((string) $this->user->name))[0] ?: 'there',
            'd' => $d,
            'unsubscribeUrl' => URL::signedRoute('newsletter.unsubscribe', ['subscriber' => $this->subscriber->getKey()]),
            'leaderboardUrl' => rtrim(config('app.url'), '/').'/leaderboard',
        ];

        return $this->subject($subject)->view('emails.roadmap-progress', $data)->text('emails.roadmap-progress-text', $data);
    }
}
