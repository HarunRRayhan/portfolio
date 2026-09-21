<?php

namespace App\Console\Commands;

use App\Mail\WeeklyNewsletterMail;
use App\Models\NewsletterCampaign;
use App\Models\NewsletterDelivery;
use App\Models\Subscriber;
use App\Support\BlogRepository;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Throwable;

class SendWeeklyNewsletter extends Command
{
    protected $signature = 'newsletter:send-weekly
                            {--dry-run : Show the campaign without creating records or sending mail}';

    protected $description = 'Generate the weekly blog digest and send it to active subscribers';

    public function handle(BlogRepository $blog): int
    {
        $dryRun = (bool) $this->option('dry-run');

        if (! config('newsletter.enabled') && ! $dryRun) {
            $this->info('Newsletter sending is disabled. Set NEWSLETTER_ENABLED=true to enable it.');

            return self::SUCCESS;
        }

        $now = now(config('newsletter.schedule.timezone'));
        $weekKey = $now->format('o-\\WW');
        $availablePosts = collect($blog->indexPosts())
            ->filter(fn (array $post): bool => ! (bool) ($post['isDraft'] ?? false))
            ->filter(fn (array $post): bool => Carbon::parse((string) $post['publishedAt'])->lte($now))
            ->values();

        $campaign = NewsletterCampaign::query()->where('key', $weekKey)->first();

        if ($campaign?->sent_at) {
            $this->info("Newsletter campaign {$weekKey} was already sent.");

            return self::SUCCESS;
        }

        if ($campaign) {
            $postsBySlug = $availablePosts->keyBy('slug');
            $posts = collect($campaign->post_slugs ?? [])
                ->map(fn (string $slug): ?array => $postsBySlug->get($slug))
                ->filter()
                ->values();
        } else {
            $posts = $this->postsForNewCampaign($availablePosts);
        }

        if ($posts->isEmpty()) {
            $this->info('No published posts are ready for this week\'s newsletter.');

            return self::SUCCESS;
        }

        $subject = $this->subjectFor($posts->all());

        if ($dryRun) {
            $subscriberCount = Subscriber::subscribed()->count();
            $this->info("Would send {$subject} to {$subscriberCount} active subscriber(s).");

            foreach ($posts as $post) {
                $this->line('- '.(string) $post['title']);
            }

            return self::SUCCESS;
        }

        if (in_array(config('mail.default'), ['log', 'array'], true) && ! app()->environment('testing')) {
            $this->error('Newsletter sending needs a real mailer. Set MAIL_MAILER=resend and configure RESEND_API_KEY.');

            return self::FAILURE;
        }

        $campaign ??= NewsletterCampaign::create([
            'key' => $weekKey,
            'post_slugs' => $posts->pluck('slug')->values()->all(),
            'subject' => $subject,
        ]);

        $subscribers = Subscriber::subscribed()->orderBy('id')->get();
        $subscriberCount = $subscribers->count();
        $campaign->update(['subscriber_count' => $subscriberCount]);

        if ($subscribers->isEmpty()) {
            $this->info("Prepared campaign {$weekKey}, but there are no active subscribers.");

            return self::SUCCESS;
        }

        $sent = 0;
        $failed = 0;

        foreach ($subscribers as $subscriber) {
            $delivery = NewsletterDelivery::query()->firstOrCreate(
                [
                    'newsletter_campaign_id' => $campaign->id,
                    'subscriber_id' => $subscriber->id,
                ],
                ['status' => NewsletterDelivery::STATUS_PENDING],
            );

            if ($delivery->status === NewsletterDelivery::STATUS_SENT) {
                continue;
            }

            try {
                Mail::to($subscriber->email)->send(new WeeklyNewsletterMail(
                    posts: $posts->all(),
                    subscriber: $subscriber,
                    subscriberCount: $subscriberCount,
                ));

                $delivery->update([
                    'status' => NewsletterDelivery::STATUS_SENT,
                    'error' => null,
                    'sent_at' => $now,
                ]);
                $sent++;
            } catch (Throwable $exception) {
                report($exception);
                $delivery->update([
                    'status' => NewsletterDelivery::STATUS_FAILED,
                    'error' => Str::limit($exception->getMessage(), 2000),
                ]);
                $failed++;
                $this->error("Delivery failed for subscriber #{$subscriber->id}: {$exception->getMessage()}");
            }
        }

        if ($failed > 0) {
            $this->error("Sent {$sent} newsletter(s); {$failed} delivery(ies) failed. Run the command again to retry them.");

            return self::FAILURE;
        }

        $campaign->update(['sent_at' => $now]);
        $this->info("Sent campaign {$weekKey} to {$sent} subscriber(s).");

        return self::SUCCESS;
    }

    /**
     * @param  Collection<int, array<string, mixed>>  $availablePosts
     * @return Collection<int, array<string, mixed>>
     */
    private function postsForNewCampaign($availablePosts)
    {
        $lastSentAt = NewsletterCampaign::query()
            ->whereNotNull('sent_at')
            ->latest('sent_at')
            ->value('sent_at');

        if ($lastSentAt === null) {
            return $availablePosts->take(config('newsletter.max_posts'))->values();
        }

        $lastSent = Carbon::parse((string) $lastSentAt);

        return $availablePosts
            ->filter(fn (array $post): bool => Carbon::parse((string) $post['publishedAt'])->gt($lastSent))
            ->take(config('newsletter.max_posts'))
            ->values();
    }

    /**
     * @param  array<int, array<string, mixed>>  $posts
     */
    private function subjectFor(array $posts): string
    {
        $firstTitle = (string) ($posts[0]['title'] ?? 'New notes from Harun.dev');

        if (count($posts) === 1) {
            return Str::limit("This week on Harun.dev: {$firstTitle}", 150, '…');
        }

        return Str::limit(
            "This week on Harun.dev: {$firstTitle} and ".(count($posts) - 1).' more',
            150,
            '…',
        );
    }
}
