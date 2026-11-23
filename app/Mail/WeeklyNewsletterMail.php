<?php

namespace App\Mail;

use App\Models\NewsletterDelivery;
use App\Models\Subscriber;
use App\Models\User;
use App\Support\NewsletterIssue;
use App\Support\RoadmapDigest;
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
        public ?array $roadmaps = null,
        public ?array $sampleProgress = null, // admin preview of the learner version
    ) {}

    /** Roadmaps added or updated this week; worked out at send time unless given. */
    private function roadmapUpdates(): array
    {
        return $this->roadmaps ??= app(NewsletterIssue::class)->recentRoadmaps(now())->all();
    }

    /** The verified site account behind this subscriber's address, if any. */
    private function member(): ?User
    {
        return $this->subscriber
            ? User::query()->whereNotNull('email_verified_at')->whereRaw('lower(email) = ?', [strtolower($this->subscriber->email)])->first()
            : null;
    }

    /** This reader's own roadmap week, when the subscriber is a signed-up learner with an unfinished roadmap. */
    private function roadmapProgress(?User $member): ?array
    {
        if ($this->sampleProgress) {
            return $this->sampleProgress;
        }

        return $member ? app(RoadmapDigest::class)->for($member, now(config('newsletter.schedule.timezone'))) : null;
    }

    public function build()
    {
        $appUrl = rtrim(config('app.url'), '/');
        $member = $this->member();
        $progress = $this->roadmapProgress($member);
        // A verified member's own first name wins (the subscribe form can't prove ownership), then the name typed
        // when subscribing, else "there" (also owner copies and previews).
        $name = trim(explode(' ', trim((string) $member?->name))[0]) ?: (trim((string) $this->subscriber?->name) ?: 'there');

        return $this->subject($this->subjectLine($progress))
            ->view('emails.newsletter.weekly', [
                'name' => $name,
                'progress' => $progress,
                'roadmapsUrl' => $appUrl.'/roadmaps',
                'leaderboardUrl' => $appUrl.'/leaderboard',
                'posts' => $this->posts,
                'products' => $this->products,
                'tweets' => $this->tweets,
                'roadmaps' => $this->roadmapUpdates(),
                'blogUrl' => rtrim(config('app.url'), '/').'/blog',
                'unsubscribeUrl' => $this->unsubscribeUrl(),
                'track' => $this->trackUrl(...),
                'openPixelUrl' => $this->delivery ? URL::signedRoute('newsletter.open', ['delivery' => $this->delivery->getKey()]) : null,
            ])
            ->text('emails.newsletter.weekly-text', [
                'name' => $name,
                'progress' => $progress,
                'roadmapsUrl' => $appUrl.'/roadmaps',
                'leaderboardUrl' => $appUrl.'/leaderboard',
                'posts' => $this->posts,
                'products' => $this->products,
                'tweets' => $this->tweets,
                'roadmaps' => $this->roadmapUpdates(),
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

    private function subjectLine(?array $progress = null): string
    {
        // An active learner sees their own week first; that's the line most likely to get opened.
        if ($progress && ! $progress['idle']) {
            $week = sprintf('Your week: %d lesson%s, %d XP', $progress['lessonsWeek'], $progress['lessonsWeek'] === 1 ? '' : 's', $progress['xpWeek']);

            return Str::limit($this->posts === [] ? "{$week} · plus roadmap updates" : "{$week} · plus {$this->posts[0]['title']}", 150, '…');
        }

        if ($this->posts === []) {
            return 'This week on Harun.dev: your roadmap week and what I’m building';
        }

        $firstTitle = (string) $this->posts[0]['title'];

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
