<?php

use App\Http\Controllers\Consultation\StripeWebhookController;
use App\Mail\Sponsorship\BookingRetiredMail;
use App\Mail\Sponsorship\CreditExpiringMail;
use App\Models\ConsultationBooking;
use App\Models\ConsultationCredit;
use App\Models\ConsultationStripeWebhookEvent;
use App\Models\GithubSponsorship;
use App\Models\User;
use App\Services\Consultation\BookingWorkflowService;
use App\Services\Consultation\ConsultationGoogleOperationService;
use App\Services\Consultation\ConsultationNotificationService;
use App\Services\Consultation\ConsultationStripeReconciliationService;
use App\Services\Consultation\SkaleAgentsBookingDelivery;
use App\Services\Consultation\StripeCheckoutService;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote')->hourly();

Artisan::command('seo:ping-sitemap {--url= : Sitemap URL to ping}', function () {
    $defaultSiteUrl = rtrim(config('app.url', url('/')), '/');
    if (preg_match('#^https?://(localhost|127\.0\.0\.1)(?::\d+)?$#', $defaultSiteUrl)) {
        $defaultSiteUrl = 'https://harun.dev';
    }

    $sitemapUrl = $this->option('url') ?: $defaultSiteUrl.'/sitemap.xml';

    $this->info('Google retired /ping?sitemap=. Resubmit the sitemap in Search Console:');
    $this->line("- {$sitemapUrl}");
    $this->line('- Property: sc-domain:harun.dev');
    $this->line('- Then URL-inspect https://harun.dev/services/devops and one blog post.');

    $this->info('Bing retired /ping?sitemap= (HTTP 410). Submit the sitemap in Bing Webmaster Tools:');
    $this->line('- https://www.bing.com/webmasters/sitemaps');
    $this->line("- robots.txt already lists {$sitemapUrl}");
    $this->line('After INDEXNOW_KEY is deployed, notify Bing with: php artisan seo:indexnow --site=https://harun.dev');
})->purpose('Remind GSC and Bing Webmaster sitemap resubmit steps');

Artisan::command('consultations:expire', function (BookingWorkflowService $workflow) {
    $holds = $workflow->expireStaleHolds();
    $unpaid = $workflow->expireUnpaidPastDeadline();
    $this->info("Expired {$holds} holds and {$unpaid} unpaid bookings.");
})->purpose('Expire stale consultation holds and unpaid payment deadlines');

Artisan::command('consultations:reconcile-stripe {--limit=50}', function (ConsultationStripeReconciliationService $reconciliation) {
    $count = $reconciliation->reconcile(max(1, (int) $this->option('limit')));
    $this->info("Reconciled {$count} consultation payment records.");
})->purpose('Reconcile Stripe checkout sessions and recover missed payment webhooks');

Artisan::command('consultations:retry-google {--limit=25}', function (ConsultationGoogleOperationService $operations, BookingWorkflowService $workflow) {
    $count = $operations->retryDue($workflow, max(1, (int) $this->option('limit')));
    $this->info("Completed {$count} Google consultation operations.");
})->purpose('Retry failed Google Calendar and Meet consultation operations');

Artisan::command('consultations:retry-notifications {--limit=100}', function (ConsultationNotificationService $notifications) {
    $count = $notifications->deliverDue(max(1, (int) $this->option('limit')));
    $this->info("Delivered {$count} consultation notifications.");
})->purpose('Retry failed consultation email notifications');

Artisan::command('consultations:send-skaleagents-events {--limit=100}', function (SkaleAgentsBookingDelivery $deliveries) {
    $count = $deliveries->sendDue(max(1, (int) $this->option('limit')));
    $totals = $deliveries->counts();
    $this->info("Delivered {$count} SkaleAgents booking events. Pending {$totals['pending']}, retrying {$totals['retrying']}, terminal {$totals['terminal']}.");
})->purpose('Deliver signed SkaleAgents consultation booking events');

Artisan::command('consultations:retry-refunds {--limit=50}', function (BookingWorkflowService $workflow) {
    $count = $workflow->retryPendingRefunds(max(1, (int) $this->option('limit')));
    $this->info("Recovered {$count} consultation refunds.");
})->purpose('Retry failed consultation cancellation refunds');

Artisan::command('consultations:audit-refunds {--limit=50}', function () {
    $bookings = ConsultationBooking::query()
        ->whereIn('status', [
            ConsultationBooking::STATUS_CANCEL_REQUESTED,
            ConsultationBooking::STATUS_CANCELLED,
        ])
        ->whereNotNull('stripe_payment_intent_id')
        ->whereNotNull('stripe_refunded_at')
        ->whereNull('stripe_refund_id')
        ->orderBy('id')
        ->limit(max(1, (int) $this->option('limit')))
        ->get(['id', 'public_id', 'stripe_payment_intent_id', 'stripe_refunded_at']);

    if ($bookings->isEmpty()) {
        $this->info('No consultation refund records need manual review.');

        return;
    }

    $this->warn('These records have a refund timestamp but no Stripe refund ID. Verify them in Stripe before retrying:');
    foreach ($bookings as $booking) {
        $this->line("{$booking->public_id} payment_intent={$booking->stripe_payment_intent_id} refunded_at={$booking->stripe_refunded_at}");
    }
})->purpose('List consultation refunds that need manual Stripe verification');

Artisan::command('consultations:retry-stripe-webhooks {--limit=25}', function (StripeWebhookController $controller) {
    $events = ConsultationStripeWebhookEvent::query()
        ->where('status', ConsultationStripeWebhookEvent::STATUS_FAILED)
        ->where(function ($query) {
            $query->whereNull('next_attempt_at')->orWhere('next_attempt_at', '<=', now('UTC'));
        })
        ->orderBy('id')
        ->limit(max(1, (int) $this->option('limit')))
        ->get();
    $count = 0;

    foreach ($events as $event) {
        try {
            $count += $controller->replayEvent($event, app(StripeCheckoutService::class), app(BookingWorkflowService::class), app(ConsultationNotificationService::class)) ? 1 : 0;
        } catch (Throwable $exception) {
            $this->warn("Webhook {$event->event_id} failed again: {$exception->getMessage()}");
        }
    }

    $this->info("Replayed {$count} Stripe consultation webhooks.");
})->purpose('Retry failed Stripe consultation webhook events from the ledger');

Artisan::command('consultations:replay-stripe-webhook {eventId}', function (StripeWebhookController $controller) {
    $event = ConsultationStripeWebhookEvent::query()->where('event_id', $this->argument('eventId'))->firstOrFail();
    $controller->replayEvent($event, app(StripeCheckoutService::class), app(BookingWorkflowService::class), app(ConsultationNotificationService::class), true);
    $this->info("Replayed Stripe webhook {$event->event_id}.");
})->purpose('Force replay of one Stripe consultation webhook event');

Artisan::command('sponsors:remind-expiring', function () {
    $sent = 0;
    // Monthly credits are skipped: their periods are short.
    $credits = ConsultationCredit::query()->usable()
        ->where('kind', ConsultationCredit::KIND_CALL)
        ->whereNotNull('user_id')
        ->whereNull('reminded_at')
        ->where('expires_at', '<=', now()->addDays(7))
        ->whereHas('sponsorship', fn ($q) => $q->where('kind', GithubSponsorship::KIND_ONE_TIME))
        ->with('user')
        ->get();

    foreach ($credits as $credit) {
        if (! $credit->user?->email) {
            continue;
        }
        try {
            Mail::to($credit->user->email)->send(new CreditExpiringMail($credit->user->name, $credit->expires_at));
            $credit->update(['reminded_at' => now()]);
            $sent++;
        } catch (Throwable $e) {
            Log::error('Sponsor credit reminder failed', ['credit' => $credit->id, 'error' => $e->getMessage()]);
        }
    }

    $this->info("Sent {$sent} credit expiry reminders.");
})->purpose('Remind sponsors whose one-time call credit expires within 7 days');

Artisan::command('consultations:retire-unpaid {--dry-run}', function (BookingWorkflowService $workflow) {
    // Legacy Stripe bookings only: credit-backed bookings have amount 0 or a credit link.
    $bookings = ConsultationBooking::query()
        ->whereIn('status', [
            ConsultationBooking::STATUS_PENDING_APPROVAL,
            ConsultationBooking::STATUS_AWAITING_PAYMENT,
            ConsultationBooking::STATUS_RESCHEDULE_PROPOSED,
        ])
        ->whereNull('stripe_paid_at')
        ->where('amount_due_cents', '>', 0)
        ->whereNotIn('id', ConsultationCredit::query()->whereNotNull('used_by_booking_id')->select('used_by_booking_id'))
        ->get();

    $retired = 0;
    foreach ($bookings as $booking) {
        if ($this->option('dry-run')) {
            $this->line("{$booking->public_id}  {$booking->status}  {$booking->client_email}  {$booking->starts_at?->toIso8601String()}");

            continue;
        }
        try {
            if (! $workflow->retireUnpaid($booking)) {
                continue;
            }
            $retired++;
        } catch (Throwable $e) {
            Log::error('Retiring unpaid booking failed', ['booking' => $booking->public_id, 'error' => $e->getMessage()]);

            continue;
        }
        try {
            Mail::to($booking->client_email)->send(new BookingRetiredMail($booking->client_name));
        } catch (Throwable $e) {
            Log::error('Retired booking mail failed', ['booking' => $booking->public_id, 'error' => $e->getMessage()]);
        }
    }

    $this->info($this->option('dry-run') ? "{$bookings->count()} bookings would be retired." : "Retired {$retired} bookings.");
})->purpose('One-off: expire unpaid legacy Stripe bookings and tell the clients');

Schedule::command('consultations:expire')
    ->everyFiveMinutes()
    ->withoutOverlapping()
    ->onOneServer();
Schedule::command('consultations:reconcile-stripe')
    ->everyFiveMinutes()
    ->withoutOverlapping()
    ->onOneServer();
Schedule::command('consultations:retry-google')
    ->everyFiveMinutes()
    ->withoutOverlapping()
    ->onOneServer();
Schedule::command('consultations:retry-notifications')
    ->everyMinute()
    ->withoutOverlapping()
    ->onOneServer();
Schedule::command('consultations:send-skaleagents-events')
    ->everyMinute()
    ->withoutOverlapping()
    ->onOneServer();
Schedule::command('consultations:retry-refunds')
    ->everyFiveMinutes()
    ->withoutOverlapping()
    ->onOneServer();
Schedule::command('consultations:retry-stripe-webhooks')
    ->everyFiveMinutes()
    ->withoutOverlapping()
    ->onOneServer();

Schedule::command('model:prune', ['--model' => [User::class]])
    ->daily()
    ->withoutOverlapping();

Schedule::command('blog:publish-scheduled')
    ->everyMinute()
    ->withoutOverlapping()
    ->onOneServer();

Schedule::command('blog:ping')
    ->everyMinute()
    ->withoutOverlapping()
    ->onOneServer();

// Tell Bing and other IndexNow engines about pages whose title, description, or content changed.
Schedule::command('seo:indexnow --changed')
    ->hourly()
    ->withoutOverlapping()
    ->onOneServer();

Schedule::command('blog:crosspost')
    ->hourly()
    ->withoutOverlapping()
    ->onOneServer();

Schedule::command('newsletter:send-weekly')
    ->weeklyOn(config('newsletter.schedule.day'), config('newsletter.schedule.time'))
    ->timezone(config('newsletter.schedule.timezone'))
    ->withoutOverlapping()
    ->onOneServer();

Schedule::command('sponsors:remind-expiring')
    ->dailyAt('09:00')
    ->withoutOverlapping()
    ->onOneServer();
