<?php

namespace Tests\Feature;

use App\Mail\Consultation\BookingAwaitingPaymentMail;
use App\Mail\Consultation\BookingPendingClientMail;
use App\Models\ConsultationBooking;
use App\Models\ConsultationNotification;
use App\Models\ConsultationTier;
use App\Services\Consultation\BookingWorkflowService;
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

    public function test_a_failed_payment_notification_does_not_activate_its_access_token(): void
    {
        $booking = $this->booking([
            'status' => ConsultationBooking::STATUS_AWAITING_PAYMENT,
            'stripe_checkout_session_id' => 'cs_notification_retry',
            'stripe_checkout_idempotency_key' => 'consultation-checkout-notification-retry',
        ]);
        $newHash = hash('sha256', 'new-payment-token');
        $notification = app(ConsultationNotificationService::class)->enqueue(
            $booking,
            $booking->client_email,
            ConsultationNotificationService::TYPE_AWAITING_PAYMENT,
            [
                'plain_token' => 'new-payment-token',
                'checkout_url' => 'https://checkout.stripe.test/cs_notification_retry',
                'activate_access_token_hash' => $newHash,
                'activate_access_token_expires_at' => now('UTC')->addDays(30)->toIso8601String(),
                'stripe_checkout_session_id' => 'cs_notification_retry',
                'stripe_checkout_idempotency_key' => 'consultation-checkout-notification-retry',
            ],
            'consultation-booking-'.$booking->id.'-awaiting-payment-cs_notification_retry',
        );

        Mail::shouldReceive('to')
            ->once()
            ->andThrow(new \RuntimeException('mail outage'));

        $this->assertFalse(app(ConsultationNotificationService::class)->deliver($notification));
        $fresh = $booking->fresh();
        $this->assertSame(hash('sha256', 'old-token'), $fresh->access_token_hash);
        $this->assertSame(ConsultationNotification::STATUS_FAILED, $notification->fresh()->status);
    }

    public function test_a_rotated_checkout_supersedes_its_pending_payment_notification(): void
    {
        Mail::fake();
        $booking = $this->booking([
            'status' => ConsultationBooking::STATUS_AWAITING_PAYMENT,
            'stripe_checkout_session_id' => 'cs_old_notification',
            'stripe_checkout_idempotency_key' => 'consultation-checkout-old',
        ]);
        $notification = app(ConsultationNotificationService::class)->enqueue(
            $booking,
            $booking->client_email,
            ConsultationNotificationService::TYPE_AWAITING_PAYMENT,
            [
                'plain_token' => 'old-payment-token',
                'checkout_url' => 'https://checkout.stripe.test/cs_old_notification',
                'stripe_checkout_session_id' => 'cs_old_notification',
                'stripe_checkout_idempotency_key' => 'consultation-checkout-old',
            ],
            'consultation-booking-'.$booking->id.'-awaiting-payment-cs_old_notification',
        );

        $this->assertTrue(app(BookingWorkflowService::class)->resetFailedStripePayment(
            $booking,
            'cs_old_notification',
            'pi_old_notification',
            'Stripe asynchronous payment failed.',
        ));

        $notifications = app(ConsultationNotificationService::class);
        $this->assertSame(ConsultationNotification::STATUS_SUPERSEDED, $notification->fresh()->status);
        $this->assertFalse($notifications->deliver($notification));
        Mail::assertNotSent(BookingAwaitingPaymentMail::class);
    }

    public function test_a_pending_payment_notification_is_superseded_when_booking_is_confirmed(): void
    {
        Mail::fake();
        $booking = $this->booking([
            'status' => ConsultationBooking::STATUS_AWAITING_PAYMENT,
            'stripe_checkout_session_id' => 'cs_confirmed_notification',
            'stripe_checkout_idempotency_key' => 'consultation-checkout-confirmed',
            'stripe_payment_intent_id' => 'pi_confirmed_notification',
            'stripe_paid_at' => now('UTC'),
            'payment_due_at' => now('UTC')->addDay(),
        ]);
        $notification = app(ConsultationNotificationService::class)->enqueue(
            $booking,
            $booking->client_email,
            ConsultationNotificationService::TYPE_AWAITING_PAYMENT,
            [
                'plain_token' => 'pending-payment-token',
                'checkout_url' => 'https://checkout.stripe.test/cs_confirmed_notification',
                'stripe_checkout_session_id' => 'cs_confirmed_notification',
                'stripe_checkout_idempotency_key' => 'consultation-checkout-confirmed',
            ],
            'consultation-booking-'.$booking->id.'-awaiting-payment-cs_confirmed_notification',
        );

        app(BookingWorkflowService::class)->confirmBooking($booking);

        $notifications = app(ConsultationNotificationService::class);
        $this->assertSame(ConsultationNotification::STATUS_SUPERSEDED, $notification->fresh()->status);
        $this->assertFalse($notifications->deliver($notification));
        Mail::assertNotSent(BookingAwaitingPaymentMail::class);
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

    public function test_a_generic_legacy_reschedule_mail_uses_its_only_proposal_event(): void
    {
        Mail::fake();
        $booking = $this->booking([
            'status' => ConsultationBooking::STATUS_RESCHEDULE_PROPOSED,
            'access_token_hash' => hash('sha256', 'old-token'),
        ]);
        $booking->recordEvent('reschedule_proposed', 'admin');
        $newHash = hash('sha256', 'generic-legacy-token');
        $notification = app(ConsultationNotificationService::class)->enqueue(
            $booking,
            $booking->client_email,
            ConsultationNotificationService::TYPE_RESCHEDULE_PROPOSED,
            [
                'plain_token' => 'generic-legacy-token',
                'activate_access_token_hash' => $newHash,
            ],
            'consultation-booking-'.$booking->id.'-reschedule-proposed',
        );

        $this->assertTrue(app(ConsultationNotificationService::class)->deliver($notification));
        $this->assertSame($newHash, $booking->fresh()->access_token_hash);
    }

    public function test_a_generic_legacy_reschedule_mail_with_multiple_proposals_is_not_activated(): void
    {
        Mail::fake();
        $booking = $this->booking([
            'status' => ConsultationBooking::STATUS_RESCHEDULE_PROPOSED,
            'access_token_hash' => hash('sha256', 'current-token'),
        ]);
        $proposalTime = now('UTC')->subMinute()->startOfSecond();
        $booking->recordEvent('reschedule_proposed', 'admin');
        $booking->recordEvent('reschedule_proposed', 'admin');
        $booking->events()
            ->where('event', 'reschedule_proposed')
            ->update([
                'created_at' => $proposalTime,
                'updated_at' => $proposalTime,
            ]);
        $newHash = hash('sha256', 'ambiguous-legacy-token');
        $notification = app(ConsultationNotificationService::class)->enqueue(
            $booking,
            $booking->client_email,
            ConsultationNotificationService::TYPE_RESCHEDULE_PROPOSED,
            [
                'plain_token' => 'ambiguous-legacy-token',
                'activate_access_token_hash' => $newHash,
            ],
            'consultation-booking-'.$booking->id.'-reschedule-proposed',
        );

        $this->assertTrue(app(ConsultationNotificationService::class)->deliver($notification));
        $this->assertSame(hash('sha256', 'current-token'), $booking->fresh()->access_token_hash);
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

    public function test_a_legacy_reschedule_mail_derives_its_proposal_event_from_the_deduplication_key(): void
    {
        Mail::fake();
        $booking = $this->booking([
            'status' => ConsultationBooking::STATUS_RESCHEDULE_PROPOSED,
            'access_token_hash' => hash('sha256', 'old-token'),
        ]);
        $proposal = $booking->recordEvent('reschedule_proposed', 'admin');
        $newHash = hash('sha256', 'legacy-new-token');
        $notification = app(ConsultationNotificationService::class)->enqueue(
            $booking,
            $booking->client_email,
            ConsultationNotificationService::TYPE_RESCHEDULE_PROPOSED,
            [
                'plain_token' => 'legacy-new-token',
                'activate_access_token_hash' => $newHash,
            ],
            'consultation-booking-'.$booking->id.'-event-'.$proposal->id.'-reschedule-proposed',
        );

        $this->assertTrue(app(ConsultationNotificationService::class)->deliver($notification));
        $this->assertSame($newHash, $booking->fresh()->access_token_hash);
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
