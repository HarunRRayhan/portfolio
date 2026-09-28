<?php

namespace App\Console\Commands;

use App\Mail\WeeklyNewsletterMail;
use App\Models\NewsletterCampaign;
use App\Models\NewsletterDelivery;
use App\Models\Subscriber;
use App\Support\BlogRepository;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;
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

        $now = now(config('newsletter.schedule.timezone'));
        $windowStart = $now->copy()->subDays(7);
        $weekKey = $now->format('o-\\WW');
        $availablePosts = collect($blog->indexPosts())
            ->filter(fn (array $post): bool => ! (bool) ($post['isDraft'] ?? false))
            ->filter(fn (array $post): bool => Carbon::parse((string) $post['publishedAt'])->lte($now))
            ->values();
        $recentPosts = $availablePosts
            ->filter(fn (array $post): bool => Carbon::parse((string) $post['publishedAt'])->gt($windowStart))
            ->values();

        if ($recentPosts->isEmpty()) {
            $this->info('No posts were published in the last seven days. Newsletter skipped.');

            return self::SUCCESS;
        }

        $campaign = NewsletterCampaign::query()->where('key', $weekKey)->first();

        if ($campaign?->sent_at) {
            $this->info("Newsletter campaign {$weekKey} was already sent.");

            return self::SUCCESS;
        }

        if ($campaign) {
            $postsBySlug = $recentPosts->keyBy('slug');
            $posts = collect($campaign->post_slugs ?? [])
                ->map(fn (string $slug): ?array => $postsBySlug->get($slug))
                ->filter()
                ->values();
        } else {
            $posts = $recentPosts
                ->take(min(3, (int) config('newsletter.max_posts')))
                ->values();
        }

        if ($posts->isEmpty()) {
            $this->info('No published posts are ready for this week\'s newsletter.');

            return self::SUCCESS;
        }

        $posts = $posts->map(function (array $post, int $index) use ($blog): array {
            if ($index !== 0 || ! isset($post['brief'])) {
                return $post;
            }

            $source = $blog->find((string) $post['slug']);

            if (! $source) {
                return $post;
            }

            $content = $blog->withContent($source);
            preg_match_all('/<p\b[^>]*>(.*?)<\/p>/si', (string) $content['content']['html'], $paragraphs);
            $intro = collect(array_slice($paragraphs[1], 0, 2))
                ->map(fn (string $paragraph): string => trim(html_entity_decode(strip_tags($paragraph), ENT_QUOTES | ENT_HTML5, 'UTF-8')))
                ->filter()
                ->implode(' ');

            if ($intro !== '') {
                $post['newsletterExcerpt'] = Str::limit($intro, 500, '…');
            }

            return $post;
        });

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
            'products' => $this->chooseProducts($weekKey),
        ]);

        if ($campaign->products === null) {
            $campaign->update(['products' => $this->chooseProducts($weekKey)]);
        }

        $subscribers = Subscriber::subscribed()->orderBy('id')->get();
        $subscriberCount = $subscribers->count();
        $campaign->update(['subscriber_count' => $subscriberCount]);
        $products = $campaign->products;
        $tweets = collect(config('newsletter.tweets', []))
            ->filter(fn (array $tweet): bool => ! empty($tweet['text']) && ! empty($tweet['url']))
            ->take(3)
            ->values()
            ->all();

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
                    products: $products,
                    tweets: $tweets,
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

    /** @return array<int, array<string, string>> */
    private function chooseProducts(string $weekKey): array
    {
        $products = collect(config('newsletter.products', []))->unique('key')->values();
        $previous = NewsletterCampaign::query()
            ->where('key', '!=', $weekKey)
            ->whereNotNull('products')
            ->latest('created_at')
            ->latest('id')
            ->first();
        $previousKeys = collect($previous?->products ?? [])->pluck('key')->all();

        return $products
            ->reject(fn (array $product): bool => in_array($product['key'], $previousKeys, true))
            ->shuffle()
            ->concat($products->filter(fn (array $product): bool => in_array($product['key'], $previousKeys, true))->shuffle())
            ->take(2)
            ->values()
            ->all();
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
