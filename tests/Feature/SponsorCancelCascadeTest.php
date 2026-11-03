<?php

namespace Tests\Feature;

use App\Mail\Consultation\BookingCancelledMail;
use App\Mail\Sponsorship\SponsorCancelFailedMail;
use App\Models\ConsultationBooking;
use App\Models\ConsultationTier;
use App\Models\GithubSponsorship;
use App\Services\Consultation\BookingWorkflowService;
use App\Services\Consultation\GoogleCalendarService;
use App\Services\Sponsorship\CancelSponsorBookings;
use App\Services\Sponsorship\SponsorCreditService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class SponsorCancelCascadeTest extends TestCase
{
    use RefreshDatabase;

    private function google(bool $deleteResult = true, ?int $times = null): void
    {
        $google = $this->createMock(GoogleCalendarService::class);
        $google->method('isConnected')->willReturn(false);
        $google->expects($times === null ? $this->any() : $this->exactly($times))
            ->method('deleteEvent')->willReturn($deleteResult);
        $this->app->instance(GoogleCalendarService::class, $google);
    }

    private function sponsorship(): GithubSponsorship
    {
        return app(SponsorCreditService::class)->recordSponsorship([
            'github_sponsor_id' => '1001', 'github_login' => 'alice', 'tier_slug' => 'pro',
            'kind' => 'one_time', 'status' => 'active', 'source' => 'webhook',
            'started_at' => now(), 'github_sponsorship_node_id' => 'S_1',
        ]);
    }

    private function booking(Carbon $startsAt, string $status = 'confirmed'): ConsultationBooking
    {
        return ConsultationBooking::create([
            'consultation_tier_id' => ConsultationTier::query()->where('slug', 'pro')->value('id'),
            'client_name' => 'C', 'client_email' => 'c@example.test',
            'starts_at' => $startsAt, 'ends_at' => $startsAt->copy()->addHour(),
            'status' => $status, 'list_price_cents' => 0, 'amount_due_cents' => 0,
            'google_event_id' => 'evt-1',
            'access_token_hash' => hash('sha256', random_bytes(8)),
        ]);
    }

    private function use(GithubSponsorship $s, ConsultationBooking $b): void
    {
        $s->credits()->first()->update(['used_by_booking_id' => $b->id, 'used_at' => now()]);
    }

    public function test_end_cancels_future_credit_booking_and_deletes_event(): void
    {
        Mail::fake();
        $this->google(true, 1);
        $s = $this->sponsorship();
        $b = $this->booking(now()->addDays(5));
        $this->use($s, $b);

        $n = app(CancelSponsorBookings::class)($s, 'cancelled');

        $this->assertSame(1, $n);
        $this->assertSame('cancelled', $b->fresh()->status);
        $this->assertNull($b->fresh()->google_event_id);
        $this->assertDatabaseHas('consultation_booking_events', ['consultation_booking_id' => $b->id, 'event' => 'sponsor_ended', 'actor' => 'system']);
        Mail::assertSent(BookingCancelledMail::class);
    }

    public function test_past_booking_untouched(): void
    {
        $this->google(true, 0);
        $s = $this->sponsorship();
        $b = $this->booking(now()->subDays(2));
        $this->use($s, $b);

        $this->assertSame(0, app(CancelSponsorBookings::class)($s, 'cancelled'));
        $this->assertSame('confirmed', $b->fresh()->status);
    }

    public function test_unused_credits_revoked(): void
    {
        $this->google();
        $s = $this->sponsorship();

        app(CancelSponsorBookings::class)($s, 'revoked');

        $this->assertSame(0, $s->credits()->whereNull('revoked_at')->count());
        $this->assertSame('revoked', $s->fresh()->status);
    }

    public function test_credit_not_released_after_sponsor_end(): void
    {
        $this->google();
        $s = $this->sponsorship();
        $b = $this->booking(now()->addDays(5));
        $this->use($s, $b);

        app(CancelSponsorBookings::class)($s, 'cancelled');

        $this->assertSame($b->id, $s->credits()->first()->used_by_booking_id);
    }

    public function test_pending_and_reschedule_states_are_cancelled_too(): void
    {
        Mail::fake();
        $this->google();
        $s = $this->sponsorship();
        $b = $this->booking(now()->addDays(5), 'reschedule_requested');
        $this->use($s, $b);

        $this->assertSame(1, app(CancelSponsorBookings::class)($s, 'cancelled'));
        $this->assertSame('cancelled', $b->fresh()->status);
    }

    public function test_failure_mails_owner_and_continues(): void
    {
        Mail::fake();
        $this->google(false);
        $s = $this->sponsorship();
        $b = $this->booking(now()->addDays(5));
        $this->use($s, $b);

        $this->assertSame(0, app(CancelSponsorBookings::class)($s, 'cancelled'));
        Mail::assertSent(SponsorCancelFailedMail::class, fn ($m) => $m->bookingPublicId === $b->public_id);
    }

    public function test_decline_returns_credit(): void
    {
        Mail::fake();
        $this->google();
        $s = $this->sponsorship();
        $b = $this->booking(now()->addDays(5), 'pending_approval');
        $this->use($s, $b);

        app(BookingWorkflowService::class)->decline($b);

        $this->assertNull($s->credits()->first()->used_by_booking_id);
    }

    public function test_approved_cancel_returns_credit(): void
    {
        Mail::fake();
        $this->google();
        $s = $this->sponsorship();
        $b = $this->booking(now()->addDays(5), 'cancel_requested');
        $this->use($s, $b);

        app(BookingWorkflowService::class)->approveCancel($b);

        $this->assertNull($s->credits()->first()->used_by_booking_id);
    }
}
