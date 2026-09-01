<?php

use App\Http\Controllers\Consultation\StripeWebhookController;
use App\Models\ConsultationBooking;
use App\Models\ConsultationStripeWebhookEvent;
use App\Services\Consultation\BookingWorkflowService;
use App\Services\Consultation\ConsultationGoogleOperationService;
use App\Services\Consultation\ConsultationNotificationService;
use App\Services\Consultation\ConsultationStripeReconciliationService;
use App\Services\Consultation\StripeCheckoutService;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
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
Schedule::command('consultations:retry-refunds')
    ->everyFiveMinutes()
    ->withoutOverlapping()
    ->onOneServer();
Schedule::command('consultations:retry-stripe-webhooks')
    ->everyFiveMinutes()
    ->withoutOverlapping()
    ->onOneServer();
