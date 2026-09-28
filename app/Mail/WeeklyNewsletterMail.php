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
     * @param  array<int, array<string, string>>  $products
     * @param  array<int, array<string, string>>  $tweets
     */
    public function __construct(
        public array $posts,
        public Subscriber $subscriber,
        public array $products,
        public array $tweets = [],
    ) {}

    public function build()
    {
        return $this->subject($this->subjectLine())
            ->view('emails.newsletter.weekly', [
                'posts' => $this->posts,
                'products' => $this->products,
                'tweets' => $this->tweets,
                'blogUrl' => rtrim(config('app.url'), '/').'/blog',
                'unsubscribeUrl' => URL::signedRoute('newsletter.unsubscribe', [
                    'subscriber' => $this->subscriber->getKey(),
                ]),
            ])
            ->text('emails.newsletter.weekly-text', [
                'posts' => $this->posts,
                'products' => $this->products,
                'tweets' => $this->tweets,
                'blogUrl' => rtrim(config('app.url'), '/').'/blog',
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
