<?php

namespace App\Mail;

use App\Models\Subscriber;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Str;

class WeeklyNewsletterMail extends Mailable
{
    use Queueable, SerializesModels;

    /**
     * @param  array<int, array<string, mixed>>  $posts
     */
    public function __construct(
        public array $posts,
        public Subscriber $subscriber,
        public int $subscriberCount,
    ) {}

    public function build()
    {
        return $this->subject($this->subjectLine())
            ->markdown('emails.newsletter.weekly', [
                'posts' => $this->posts,
                'subscriberCount' => $this->subscriberCount,
                'unsubscribeUrl' => URL::signedRoute('newsletter.unsubscribe', [
                    'subscriber' => $this->subscriber->getKey(),
                ]),
            ]);
    }

    private function subjectLine(): string
    {
        $firstTitle = (string) ($this->posts[0]['title'] ?? 'New notes from Harun.dev');

        if (count($this->posts) === 1) {
            return Str::limit("This week on Harun.dev: {$firstTitle}", 150, '…');
        }

        return Str::limit(
            "This week on Harun.dev: {$firstTitle} and ".(count($this->posts) - 1).' more',
            150,
            '…',
        );
    }
}
