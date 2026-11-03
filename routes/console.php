<?php

use App\Mail\Sponsorship\CreditExpiringMail;
use App\Models\ConsultationCredit;
use App\Models\GithubSponsorship;
use App\Models\User;
use App\Services\Consultation\BookingWorkflowService;
use App\Services\Consultation\ConsultationGoogleOperationService;
use App\Services\Consultation\ConsultationNotificationService;
use App\Services\Consultation\SkaleAgentsBookingDelivery;
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
    $this->info("Expired {$holds} holds.");
})->purpose('Expire stale consultation holds');

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

Schedule::command('consultations:expire')
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
