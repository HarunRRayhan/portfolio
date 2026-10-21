<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Mail\WeeklyNewsletterMail;
use App\Models\NewsletterCampaign;
use App\Models\NewsletterClick;
use App\Models\NewsletterDelivery;
use App\Models\Subscriber;
use App\Support\NewsletterIssue;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class NewsletterController extends Controller
{
    public function index(): Response
    {
        $subscribers = Subscriber::query()
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->paginate(25);

        $subscribers->getCollection()->transform(fn (Subscriber $subscriber) => $this->toPayload($subscriber));

        return Inertia::render('Admin/Newsletter/Index', [
            'subscribers' => $subscribers,
        ]);
    }

    public function campaigns(): Response
    {
        $count = fn (string $status) => fn ($query) => $query->where('status', $status);

        $campaigns = NewsletterCampaign::query()
            ->withCount([
                'deliveries as sent_count' => $count(NewsletterDelivery::STATUS_SENT),
                'deliveries as failed_count' => $count(NewsletterDelivery::STATUS_FAILED),
                'deliveries as pending_count' => $count(NewsletterDelivery::STATUS_PENDING),
                'deliveries as opened_count' => fn ($query) => $query->whereNotNull('opened_at'),
                'deliveries as clicker_count' => fn ($query) => $query->has('clicks'),
                'clicks as click_count',
            ])
            ->with(['deliveries' => fn ($query) => $query->where('status', NewsletterDelivery::STATUS_FAILED)->with('subscriber')])
            ->latest('id')
            ->paginate(20);

        $linkClicks = NewsletterClick::query()
            ->join('newsletter_deliveries', 'newsletter_deliveries.id', '=', 'newsletter_clicks.newsletter_delivery_id')
            ->whereIn('newsletter_deliveries.newsletter_campaign_id', $campaigns->getCollection()->modelKeys())
            ->groupBy('newsletter_deliveries.newsletter_campaign_id', 'newsletter_clicks.url')
            ->selectRaw('newsletter_deliveries.newsletter_campaign_id as campaign_id, newsletter_clicks.url, count(*) as clicks, count(distinct newsletter_clicks.newsletter_delivery_id) as people')
            ->orderByDesc('clicks')
            ->get()
            ->groupBy('campaign_id');

        $campaigns->getCollection()->transform(fn (NewsletterCampaign $campaign) => [
            'id' => $campaign->id,
            'key' => $campaign->key,
            'subject' => $campaign->subject,
            'post_count' => count($campaign->post_slugs ?? []),
            'subscriber_count' => $campaign->subscriber_count,
            'sent_count' => $campaign->sent_count,
            'failed_count' => $campaign->failed_count,
            'pending_count' => $campaign->pending_count,
            'opened_count' => $campaign->opened_count,
            'click_count' => $campaign->click_count,
            'clicker_count' => $campaign->clicker_count,
            'links' => ($linkClicks[$campaign->id] ?? collect())->map(fn (NewsletterClick $link) => [
                'url' => $link->url,
                'clicks' => (int) $link->clicks,
                'people' => (int) $link->people,
            ])->values()->all(),
            'created_at' => $campaign->created_at?->toIso8601String(),
            'sent_at' => $campaign->sent_at?->toIso8601String(),
            'failures' => $campaign->deliveries->map(fn (NewsletterDelivery $delivery) => [
                'id' => $delivery->id,
                'masked_email' => $delivery->subscriber?->maskedEmail() ?? 'deleted subscriber',
                // Mailer errors can quote the recipient, so mask anything shaped like an address.
                'error' => $delivery->error === null ? null : preg_replace_callback('/[^\s<>"\'@]+@[^\s<>"\']+/', fn (array $match) => (new Subscriber(['email' => $match[0]]))->maskedEmail(), $delivery->error),
            ])->all(),
        ]);

        return Inertia::render('Admin/Newsletter/Campaigns', [
            'campaigns' => $campaigns,
            'schedule' => config('newsletter.schedule'),
            'activeSubscribers' => Subscriber::subscribed()->count(),
            // Same week key the send command uses.
            'sentThisWeekAt' => NewsletterCampaign::query()
                ->where('key', now(config('newsletter.schedule.timezone'))->format('o-\\WW'))
                ->first()?->sent_at?->toIso8601String(),
        ]);
    }

    public function templates(): Response
    {
        return Inertia::render('Admin/Newsletter/Templates');
    }

    /** Renders the default template with this week's posts (or the latest ones) for the preview iframe. */
    public function preview(NewsletterIssue $issue): \Illuminate\Http\Response
    {
        return response($this->previewMail($issue)->render())
            ->header('Cache-Control', 'no-store, private');
    }

    /** The email as this campaign sent it: its posts and products (tweets are not stored, so they are today's). */
    public function campaignPreview(NewsletterIssue $issue, string $campaign): \Illuminate\Http\Response
    {
        $record = NewsletterCampaign::query()->findOrFail($campaign);

        if ($record->html !== null) {
            return response($record->html)->header('Cache-Control', 'no-store, private');
        }

        // Campaigns sent before the HTML was stored are rebuilt from their posts and products.
        $postsBySlug = $issue->publishedPosts(now(config('newsletter.schedule.timezone')))->keyBy('slug');
        $posts = collect($record->post_slugs ?? [])->map(fn (string $slug) => $postsBySlug->get($slug))->filter()->values();

        $mail = new WeeklyNewsletterMail(
            posts: $issue->withLeadExcerpt($posts)->all(),
            subscriber: null,
            products: $record->products ?? [],
            tweets: $issue->tweets(),
        );

        return response($mail->render())->header('Cache-Control', 'no-store, private');
    }

    public function sendTest(Request $request, NewsletterIssue $issue): RedirectResponse
    {
        $email = $request->validate(['email' => ['required', 'email:rfc', 'max:255']])['email'];

        try {
            Mail::to($email)->send($this->previewMail($issue));
        } catch (Throwable $exception) {
            report($exception);

            return back()->with('flash', ['type' => 'error', 'message' => 'Test email failed: '.$exception->getMessage()]);
        }

        return back()->with('flash', ['type' => 'success', 'message' => "Test email sent to {$email}."]);
    }

    /** Runs the same command the scheduler runs; it is idempotent and retries failed deliveries. */
    public function sendNow(Request $request): RedirectResponse
    {
        Log::info('Admin triggered the weekly newsletter.', ['admin_id' => $request->user()->id]);

        // shortcut: sends synchronously in the request; move to a queued job if the list outgrows the request timeout.
        $exitCode = Artisan::call('newsletter:send-weekly');

        return back()->with('flash', [
            'type' => $exitCode === 0 ? 'success' : 'error',
            'message' => trim(Artisan::output()) ?: 'Newsletter command finished.',
        ]);
    }

    /** Manual lookup for the same reason as reveal(): don't leak id existence before role:admin runs. */
    public function toggleStatus(string $subscriberId): RedirectResponse
    {
        $subscriber = Subscriber::findOrFail($subscriberId);
        $subscriber->update(['status' => $subscriber->status === 'subscribed' ? 'unsubscribed' : 'subscribed']);

        return back();
    }

    /**
     * Looks the subscriber up manually rather than via implicit route-model
     * binding: binding runs as route middleware, before the role:admin
     * check in this route's own middleware stack, so a non-admin could
     * otherwise tell real subscriber ids from fake ones by whether they get
     * a 404 (binding failed) or a 403 (role check failed). A plain id
     * param defers the lookup into the controller, which only ever runs
     * after every middleware -- including role:admin -- has passed.
     */
    public function reveal(string $subscriberId, Request $request): JsonResponse
    {
        $subscriber = Subscriber::findOrFail($subscriberId);

        Log::info('Admin revealed a subscriber email.', [
            'admin_id' => $request->user()->id,
            'subscriber_id' => $subscriber->id,
        ]);

        return response()->json(['email' => $subscriber->email])
            ->header('Cache-Control', 'no-store, private');
    }

    private function previewMail(NewsletterIssue $issue): WeeklyNewsletterMail
    {
        $now = now(config('newsletter.schedule.timezone'));
        $posts = $issue->recentPosts($now);
        $posts = ($posts->isEmpty() ? $issue->publishedPosts($now) : $posts)
            ->take((int) config('newsletter.max_posts'))
            ->values();

        return new WeeklyNewsletterMail(
            posts: $issue->withLeadExcerpt($posts)->all(),
            subscriber: null,
            products: $issue->chooseProducts(),
            tweets: $issue->tweets(),
        );
    }

    /**
     * @return array<string, mixed>
     */
    private function toPayload(Subscriber $subscriber): array
    {
        return [
            'id' => $subscriber->id,
            'masked_email' => $subscriber->maskedEmail(),
            'source' => $subscriber->source,
            'status' => $subscriber->status,
            'created_at' => $subscriber->created_at?->toIso8601String(),
        ];
    }
}
