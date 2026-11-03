<?php

namespace Tests\Feature;

use App\Mail\Sponsorship\BookingRetiredMail;
use App\Mail\Sponsorship\CreditExpiringMail;
use App\Models\ConsultationBooking;
use App\Models\ConsultationTier;
use App\Models\User;
use App\Services\Consultation\BookingWorkflowService;
use App\Services\Consultation\GoogleCalendarService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\Support\CreatesSponsorCredits;
use Tests\TestCase;

class SponsorCommandsTest extends TestCase
{
    use CreatesSponsorCredits;
    use RefreshDatabase;

    private function user(): User
    {
        return User::factory()->create(['terms_accepted_at' => now()]);
    }

    private function google(bool $ok = true): void
    {
        $google = $this->createMock(GoogleCalendarService::class);
        $google->method('isConnected')->willReturn(false);
        $google->method('deleteEvent')->willReturn($ok);
        $this->app->instance(GoogleCalendarService::class, $google);
    }

    private function booking(string $status, array $o = []): ConsultationBooking
    {
        return ConsultationBooking::create($o + [
            'consultation_tier_id' => ConsultationTier::query()->where('slug', 'pro')->value('id'),
            'client_name' => 'C', 'client_email' => 'c@example.test',
            'starts_at' => now()->addDays(5), 'ends_at' => now()->addDays(5)->addHour(),
            'status' => $status, 'list_price_cents' => 15000, 'amount_due_cents' => 15000,
            'google_event_id' => 'evt-1',
            'access_token_hash' => hash('sha256', random_bytes(8)),
        ]);
    }

    public function test_reminder_sent_once(): void
    {
        Mail::fake();
        $user = $this->user();
        $credit = $this->sponsorCredit($user, 'light', ['expires_at' => now()->addDays(3)]);

        $this->artisan('sponsors:remind-expiring')->assertExitCode(0);
        $this->artisan('sponsors:remind-expiring')->assertExitCode(0);

        Mail::assertSent(CreditExpiringMail::class, 1);
        $this->assertNotNull($credit->fresh()->reminded_at);
    }

    public function test_reminder_skips_far_expiry_and_monthly(): void
    {
        Mail::fake();
        $user = $this->user();
        $this->sponsorCredit($user, 'light', ['expires_at' => now()->addDays(30)]);
        $monthly = $this->sponsorCredit($user, 'light', ['expires_at' => now()->addDays(2)]);
        $monthly->sponsorship->update(['kind' => 'monthly']);

        $this->artisan('sponsors:remind-expiring')->assertExitCode(0);

        Mail::assertNothingSent();
    }

    public function test_failed_reminder_stays_unreminded(): void
    {
        Mail::shouldReceive('to')->andThrow(new \RuntimeException('smtp down'));
        $credit = $this->sponsorCredit($this->user(), 'light', ['expires_at' => now()->addDays(3)]);

        $this->artisan('sponsors:remind-expiring')->assertExitCode(0);

        $this->assertNull($credit->fresh()->reminded_at);
    }

    public function test_retire_dry_run_changes_nothing(): void
    {
        Mail::fake();
        $this->google();
        $b = $this->booking('awaiting_payment');

        $this->artisan('consultations:retire-unpaid --dry-run')
            ->expectsOutputToContain($b->public_id)->assertExitCode(0);

        $this->assertSame('awaiting_payment', $b->fresh()->status);
        Mail::assertNothingSent();
    }

    public function test_retire_expires_unpaid_and_keeps_paid(): void
    {
        Mail::fake();
        $this->google();
        $unpaid = $this->booking('pending_approval');
        $paid = $this->booking('awaiting_payment', ['stripe_paid_at' => now()]);
        $confirmed = $this->booking('confirmed');

        $this->artisan('consultations:retire-unpaid')->assertExitCode(0);

        $this->assertSame('expired', $unpaid->fresh()->status);
        $this->assertNull($unpaid->fresh()->google_event_id);
        $this->assertSame('awaiting_payment', $paid->fresh()->status);
        $this->assertSame('confirmed', $confirmed->fresh()->status);
        Mail::assertSent(BookingRetiredMail::class, 1);
    }

    public function test_retire_skips_credit_bookings(): void
    {
        Mail::fake();
        $this->google();
        $credit = $this->sponsorCredit($this->user());
        $b = $this->booking('pending_approval', ['list_price_cents' => 0, 'amount_due_cents' => 0]);
        $credit->update(['used_by_booking_id' => $b->id, 'used_at' => now()]);
        // Even with a nonzero amount, a credit link protects it.
        $linked = $this->booking('pending_approval');
        $this->sponsorCredit($this->user())->update(['used_by_booking_id' => $linked->id, 'used_at' => now()]);

        $this->artisan('consultations:retire-unpaid')->assertExitCode(0);

        $this->assertSame('pending_approval', $b->fresh()->status);
        $this->assertSame('pending_approval', $linked->fresh()->status);
        Mail::assertNothingSent();
    }

    public function test_retire_rechecks_booking_under_lock(): void
    {
        Mail::fake();
        $this->google();
        $workflow = app(BookingWorkflowService::class);
        // Stale copies from the retire list; the rows changed before the lock.
        $paid = $this->booking('awaiting_payment');
        $confirmed = $this->booking('pending_approval');
        $credited = $this->booking('pending_approval');
        ConsultationBooking::whereKey($paid->id)->update(['stripe_paid_at' => now()]);
        ConsultationBooking::whereKey($confirmed->id)->update(['status' => 'confirmed', 'confirmed_at' => now()]);
        $this->sponsorCredit($this->user())->update(['used_by_booking_id' => $credited->id, 'used_at' => now()]);

        foreach ([$paid, $confirmed, $credited] as $b) {
            $this->assertFalse($workflow->retireUnpaid($b));
        }

        $this->assertSame('awaiting_payment', $paid->fresh()->status);
        $this->assertSame('confirmed', $confirmed->fresh()->status);
        $this->assertSame('pending_approval', $credited->fresh()->status);
        $this->assertSame('evt-1', $credited->fresh()->google_event_id);
    }
}
