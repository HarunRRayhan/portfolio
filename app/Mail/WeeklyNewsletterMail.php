<?php

namespace App\Mail;

use App\Models\NewsletterDelivery;
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
        public ?Subscriber $subscriber,
        public array $products,
        public array $tweets = [],
        public ?NewsletterDelivery $delivery = null,
    ) {}

    public function build()
    {
        return $this->subject($this->subjectLine())
            ->view('emails.newsletter.weekly', [
                'posts' => $this->posts,
                'products' => $this->products,
                'tweets' => $this->tweets,
                'blogUrl' => rtrim(config('app.url'), '/').'/blog',
                'unsubscribeUrl' => $this->unsubscribeUrl(),
                'track' => $this->trackUrl(...),
                'openPixelUrl' => $this->delivery ? URL::signedRoute('newsletter.open', ['delivery' => $this->delivery->getKey()]) : null,
            ])
            ->text('emails.newsletter.weekly-text', [
                'posts' => $this->posts,
                'products' => $this->products,
                'tweets' => $this->tweets,
                'blogUrl' => rtrim(config('app.url'), '/').'/blog',
                'unsubscribeUrl' => $this->unsubscribeUrl(),
                'track' => $this->trackUrl(...),
            ]);
    }

    /** Wraps a link in the signed click redirect; owner copies and previews keep the plain link. */
    private function trackUrl(string $url): string
    {
        return $this->delivery
            ? URL::signedRoute('newsletter.click', ['delivery' => $this->delivery->getKey(), 'url' => $url])
            : $url;
    }

    /** Owner copies and previews have no subscriber, so their unsubscribe link points at the blog. */
    private function unsubscribeUrl(): string
    {
        return $this->subscriber
            ? URL::signedRoute('newsletter.unsubscribe', ['subscriber' => $this->subscriber->getKey()])
            : rtrim(config('app.url'), '/').'/blog';
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
