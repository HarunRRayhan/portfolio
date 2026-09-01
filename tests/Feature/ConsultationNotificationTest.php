<?php

namespace Tests\Feature;

use App\Mail\Consultation\BookingPendingClientMail;
use App\Models\ConsultationBooking;
use App\Models\ConsultationNotification;
use App\Models\ConsultationTier;
use App\Services\Consultation\ConsultationNotificationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class ConsultationNotificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_a_failed_notification_remains_durable_until_a_later_attempt_succeeds(): void
    {
        Mail::fake();
        $booking = $this->booking();
        $notifications = app(ConsultationNotificationService::class);

        $notification = $notifications->enqueue(
            $booking,
            $booking->client_email,
            ConsultationNotificationService::TYPE_PENDING_CLIENT,
            ['plain_token' => 'retry-token'],
            'consultation-booking-'.$booking->id.'-notification-retry',
        );
        $notification->forceFill([
            'status' => ConsultationNotification::STATUS_FAILED,
            'attempts' => 1,
            'available_at' => now('UTC')->subMinute(),
            'last_error' => 'temporary mail outage',
        ])->save();

        $this->assertSame(1, $notifications->deliverDueForBooking($booking->id));
        $this->assertDatabaseHas('consultation_notifications', [
            'id' => $notification->id,
            'status' => ConsultationNotification::STATUS_SENT,
            'attempts' => 2,
        ]);
        Mail::assertSent(BookingPendingClientMail::class);
    }

    public function test_reschedule_access_token_is_activated_only_after_the_mail_is_sent(): void
    {
        Mail::fake();
        $booking = $this->booking([
            'status' => ConsultationBooking::STATUS_RESCHEDULE_PROPOSED,
            'access_token_hash' => hash('sha256', 'old-token'),
        ]);
        $newHash = hash('sha256', 'new-token');
        $notification = app(ConsultationNotificationService::class)->enqueue(
            $booking,
            $booking->client_email,
            ConsultationNotificationService::TYPE_RESCHEDULE_PROPOSED,
            [
                'plain_token' => 'new-token',
                'activate_access_token_hash' => $newHash,
                'activate_access_token_expires_at' => now('UTC')->addDays(30)->toIso8601String(),
            ],
            'consultation-booking-'.$booking->id.'-reschedule-proposed',
        );

        $this->assertTrue(app(ConsultationNotificationService::class)->deliver($notification));
        $this->assertSame($newHash, $booking->fresh()->access_token_hash);
    }

    public function test_a_delayed_older_reschedule_mail_cannot_activate_its_token(): void
    {
        Mail::fake();
        $booking = $this->booking([
            'status' => ConsultationBooking::STATUS_RESCHEDULE_PROPOSED,
            'access_token_hash' => hash('sha256', 'current-token'),
        ]);
        $oldProposal = $booking->recordEvent('reschedule_proposed', 'admin');
        $newProposal = $booking->recordEvent('reschedule_proposed', 'admin');

        $notifications = app(ConsultationNotificationService::class);
        $oldNotification = $notifications->enqueue(
            $booking,
            $booking->client_email,
            ConsultationNotificationService::TYPE_RESCHEDULE_PROPOSED,
            [
                'plain_token' => 'old-token',
                'activate_access_token_hash' => hash('sha256', 'old-token'),
                'proposal_event_id' => $oldProposal->id,
            ],
            'consultation-booking-'.$booking->id.'-old-proposal',
        );
        $newNotification = $notifications->enqueue(
            $booking,
            $booking->client_email,
            ConsultationNotificationService::TYPE_RESCHEDULE_PROPOSED,
            [
                'plain_token' => 'new-token',
                'activate_access_token_hash' => hash('sha256', 'new-token'),
                'proposal_event_id' => $newProposal->id,
            ],
            'consultation-booking-'.$booking->id.'-new-proposal',
        );

        $this->assertTrue($notifications->deliver($oldNotification));
        $this->assertSame(hash('sha256', 'current-token'), $booking->fresh()->access_token_hash);
        $this->assertTrue($notifications->deliver($newNotification));
        $this->assertSame(hash('sha256', 'new-token'), $booking->fresh()->access_token_hash);
    }

    /** @param array<string, mixed> $overrides */
    private function booking(array $overrides = []): ConsultationBooking
    {
        $tier = ConsultationTier::query()->where('slug', 'light')->firstOrFail();
        $startsAt = now('UTC')->addDays(3)->setTime(10, 0);

        return ConsultationBooking::create(array_merge([
            'consultation_tier_id' => $tier->id,
            'client_name' => 'Notification client',
            'client_email' => 'notification@example.com',
            'starts_at' => $startsAt,
            'ends_at' => $startsAt->copy()->addMinutes($tier->duration_minutes),
            'status' => ConsultationBooking::STATUS_PENDING_APPROVAL,
            'list_price_cents' => $tier->price_cents,
            'amount_due_cents' => $tier->price_cents,
            'currency' => 'usd',
            'access_token_hash' => hash('sha256', 'old-token'),
        ], $overrides));
    }
}
