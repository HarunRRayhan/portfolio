<?php

namespace Tests\Feature;

use App\Mail\Consultation\BookingCancellationDeniedMail;
use App\Mail\Consultation\BookingConfirmedMail;
use App\Mail\Consultation\BookingDeclinedMail;
use App\Mail\Consultation\BookingRescheduleDeniedMail;
use App\Models\ConsultationAvailabilityWindow;
use App\Models\ConsultationBooking;
use App\Models\ConsultationCoupon;
use App\Models\ConsultationGoogleOperation;
use App\Models\ConsultationSetting;
use App\Models\ConsultationTier;
use App\Models\User;
use App\Services\Consultation\BookingWorkflowService;
use App\Services\Consultation\ConsultationGoogleOperationService;
use App\Services\Consultation\ConsultationNotificationService;
use App\Services\Consultation\GoogleCalendarService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Mail\Transport\ArrayTransport;
use Illuminate\Support\Facades\Mail;
use Tests\Support\CreatesSponsorCredits;
use Tests\TestCase;

class ConsultationBookingTest extends TestCase
{
    use CreatesSponsorCredits;
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();

        // These tests use UTC wall-clock fixtures. Keep their availability
        // explicit instead of coupling them to the owner's production zone.
        ConsultationSetting::setValue('schedule_timezone', 'UTC');
        ConsultationAvailabilityWindow::query()->delete();

        $now = now();
        foreach ([1, 2, 3, 4, 5] as $weekday) {
            ConsultationAvailabilityWindow::create([
                'weekday' => $weekday,
                'start_time' => '10:00:00',
                'end_time' => '13:00:00',
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
            ConsultationAvailabilityWindow::create([
                'weekday' => $weekday,
                'start_time' => '20:00:00',
                'end_time' => '23:00:00',
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }
    }

    public function test_enabled_skaleagents_reference_is_hashed_on_booking_and_not_projected(): void
    {
        Mail::fake();
        config()->set('consultation.skaleagents_handoff_enabled', true);
        $reference = rtrim(strtr(base64_encode(random_bytes(24)), '+/', '-_'), '=');
        $tier = ConsultationTier::query()->where('slug', 'light')->firstOrFail();

        $user = User::factory()->create(['email' => 'linked@example.com']);
        $this->actingAs($user)->post('/book', [
            'credit_id' => $this->sponsorCredit($user, $tier->slug)->id,
            'client_name' => 'Linked customer',
            'company_name' => 'Acme',
            'website' => 'https://acme.test',
            'notes' => 'Kubernetes help',
            'starts_at' => $this->nextWeekdayAt(10)->toIso8601String(),
            'sa_ref' => $reference,
        ])->assertRedirect();

        $booking = ConsultationBooking::query()->firstOrFail();
        $this->assertSame(hash('sha256', $reference), $booking->skaleagents_referral_hash);
        $this->assertStringNotContainsString($reference, json_encode($booking->toAdminArray()));
        $this->assertStringNotContainsString($reference, json_encode($booking->toClientArray()));
    }

    public function test_skaleagents_reference_is_ignored_when_handoff_is_disabled(): void
    {
        Mail::fake();
        config()->set('consultation.skaleagents_handoff_enabled', false);
        $tier = ConsultationTier::query()->where('slug', 'light')->firstOrFail();

        $user = User::factory()->create(['email' => 'direct@example.com']);
        $this->actingAs($user)->post('/book', [
            'credit_id' => $this->sponsorCredit($user, $tier->slug)->id,
            'client_name' => 'Direct customer',
            'company_name' => 'Acme',
            'website' => 'https://acme.test',
            'notes' => 'Kubernetes help',
            'starts_at' => $this->nextWeekdayAt(10)->toIso8601String(),
            'sa_ref' => str_repeat('A', 32),
        ])->assertRedirect();

        $this->assertNull(ConsultationBooking::query()->firstOrFail()->skaleagents_referral_hash);
    }

    public function test_invalid_skaleagents_reference_is_rejected_when_handoff_is_enabled(): void
    {
        config()->set('consultation.skaleagents_handoff_enabled', true);
        $tier = ConsultationTier::query()->where('slug', 'light')->firstOrFail();

        $user = User::factory()->create(['email' => 'invalid@example.com']);
        $this->actingAs($user)->post('/book', [
            'credit_id' => $this->sponsorCredit($user, $tier->slug)->id,
            'client_name' => 'Invalid reference',
            'company_name' => 'Acme',
            'website' => 'https://acme.test',
            'notes' => 'Kubernetes help',
            'starts_at' => $this->nextWeekdayAt(10)->toIso8601String(),
            'sa_ref' => 'not-a-valid-reference',
        ])->assertSessionHasErrors('sa_ref');

        $this->assertDatabaseCount('consultation_bookings', 0);
    }

    public function test_book_page_does_not_send_the_reference_as_a_referrer(): void
    {
        $this->get('/consultation?sa_ref='.str_repeat('A', 32))
            ->assertOk()
            ->assertHeader('Referrer-Policy', 'no-referrer');
    }

    public function test_booking_request_mail_reaches_the_client_and_the_owner_separately(): void
    {
        $this->assertNull(config('mail.to.address'));
        config(['mail.owner.address' => 'owner@example.com']);

        $tier = ConsultationTier::query()->where('slug', 'light')->firstOrFail();
        $this->app->make(BookingWorkflowService::class)->requestBooking(
            $tier,
            'Shehab',
            'shehab@example.com',
            'Azure guidelines',
            $this->nextWeekdayAt(11),
        );

        $transport = Mail::mailer()->getSymfonyTransport();
        $this->assertInstanceOf(ArrayTransport::class, $transport);

        $byRecipient = [];
        foreach ($transport->messages() as $sent) {
            $addresses = array_map(
                fn ($address) => $address->getAddress(),
                $sent->getEnvelope()->getRecipients(),
            );
            $this->assertCount(1, $addresses);
            $byRecipient[$addresses[0]] = (string) $sent->getOriginalMessage()->getHtmlBody();
        }

        $this->assertSame(['owner@example.com', 'shehab@example.com'], collect(array_keys($byRecipient))->sort()->values()->all());
        $this->assertStringContainsString('Hi Shehab', $byRecipient['shehab@example.com']);
        $this->assertStringContainsString('harun-logo-email.png', $byRecipient['shehab@example.com']);
        $this->assertStringContainsString('New consultation request', $byRecipient['owner@example.com']);
        $this->assertStringContainsString('shehab@example.com', $byRecipient['owner@example.com']);
    }

    public function test_a_decline_email_includes_the_customer_message_and_hides_the_internal_note(): void
    {
        Mail::fake();

        $google = $this->createMock(GoogleCalendarService::class);
        $google->method('isConnected')->willReturn(false);
        $google->method('deleteEvent')->willReturn(true);
        $this->app->instance(GoogleCalendarService::class, $google);

        $tier = ConsultationTier::query()->where('slug', 'light')->firstOrFail();
        $startsAt = $this->nextWeekdayAt(10);
        $booking = ConsultationBooking::create([
            'consultation_tier_id' => $tier->id,
            'client_name' => 'Shehab',
            'client_email' => 'shehab@example.com',
            'starts_at' => $startsAt,
            'ends_at' => $startsAt->copy()->addMinutes($tier->duration_minutes),
            'status' => ConsultationBooking::STATUS_PENDING_APPROVAL,
            'list_price_cents' => $tier->price_cents,
            'amount_due_cents' => $tier->price_cents,
            'currency' => 'usd',
            'access_token_hash' => hash('sha256', 'decline-message'),
        ]);

        $this->app->make(BookingWorkflowService::class)->decline(
            $booking,
            false,
            null,
            'internal: private calendar hold',
            "This overlaps another commitment.\nPlease pick a later afternoon.",
        );

        $booking->refresh();
        $this->assertSame('internal: private calendar hold', $booking->admin_note);
        $this->assertSame("This overlaps another commitment.\nPlease pick a later afternoon.", $booking->client_message);

        Mail::assertSent(BookingDeclinedMail::class, function (BookingDeclinedMail $mail) {
            $html = $mail->render();

            $messageAt = strpos($html, 'This overlaps another commitment.');
            $stockAt = strpos($html, 'Unfortunately we');

            return $mail->hasTo('shehab@example.com')
                && $messageAt !== false
                && $stockAt !== false
                && $messageAt < $stockAt
                && str_contains($html, 'Please pick a later afternoon.')
                && ! str_contains($html, 'internal: private calendar hold');
        });
    }

    public function test_first_one_thousand_one_booking_requests_receive_the_launch_discount(): void
    {
        Mail::fake();

        $tier = ConsultationTier::query()->where('slug', 'light')->firstOrFail();
        $result = $this->app->make(BookingWorkflowService::class)->requestBooking(
            $tier,
            'Launch customer',
            'launch@example.com',
            null,
            $this->nextWeekdayAt(10),
            null,
            'Launch Company',
        );

        $booking = $result['booking']->fresh();

        $this->assertSame(44900, $booking->list_price_cents);
        $this->assertSame('Launch Company', $booking->company_name);
        $this->assertSame(10000, $booking->campaign_discount_cents);
        $this->assertSame(0, $booking->discount_percent);
        $this->assertSame(34900, $booking->amount_due_cents);
        $this->assertSame('1', ConsultationSetting::query()
            ->where('key', 'consultation_booking_promotion_claimed_count')
            ->value('value'));
    }

    public function test_launch_discount_is_applied_before_a_percentage_coupon(): void
    {
        Mail::fake();

        $tier = ConsultationTier::query()->where('slug', 'light')->firstOrFail();
        $coupon = ConsultationCoupon::create([
            'code' => 'STACK20',
            'percent_off' => 20,
            'tier_slugs' => [$tier->slug],
            'is_active' => true,
        ]);

        $result = $this->app->make(BookingWorkflowService::class)->requestBooking(
            $tier,
            'Stacked discount customer',
            'stacked@example.com',
            null,
            $this->nextWeekdayAt(20),
            $coupon,
        );

        $booking = $result['booking']->fresh();

        $this->assertSame(10000, $booking->campaign_discount_cents);
        $this->assertSame(20, $booking->discount_percent);
        $this->assertSame(27920, $booking->amount_due_cents);
        $this->assertSame('1', ConsultationSetting::query()
            ->where('key', 'consultation_booking_promotion_claimed_count')
            ->value('value'));
    }

    public function test_only_the_first_one_thousand_one_requests_claim_the_launch_discount(): void
    {
        Mail::fake();
        ConsultationSetting::setValue('consultation_booking_promotion_claimed_count', '1000');

        $tier = ConsultationTier::query()->where('slug', 'light')->firstOrFail();
        $workflow = $this->app->make(BookingWorkflowService::class);
        $first = $workflow->requestBooking(
            $tier,
            'Customer one',
            'customer-one@example.com',
            null,
            $this->nextWeekdayAt(10),
        )['booking']->fresh();
        $second = $workflow->requestBooking(
            $tier,
            'Customer two',
            'customer-two@example.com',
            null,
            $this->nextWeekdayAt(10)->addWeek(),
        )['booking']->fresh();

        $this->assertSame(10000, $first->campaign_discount_cents);
        $this->assertSame(0, $second->campaign_discount_cents);
        $this->assertSame(34900, $first->amount_due_cents);
        $this->assertSame(44900, $second->amount_due_cents);
        $this->assertSame('1001', ConsultationSetting::query()
            ->where('key', 'consultation_booking_promotion_claimed_count')
            ->value('value'));
    }

    public function test_invalid_coupon_does_not_consume_a_launch_discount_claim(): void
    {
        $tier = ConsultationTier::query()->where('slug', 'light')->firstOrFail();
        $coupon = ConsultationCoupon::create([
            'code' => 'INACTIVE20',
            'percent_off' => 20,
            'tier_slugs' => [$tier->slug],
            'is_active' => false,
        ]);

        $this->expectException(\InvalidArgumentException::class);

        try {
            $this->app->make(BookingWorkflowService::class)->requestBooking(
                $tier,
                'Invalid coupon customer',
                'invalid-coupon@example.com',
                null,
                $this->nextWeekdayAt(10),
                $coupon,
            );
        } finally {
            $this->assertSame('0', ConsultationSetting::query()
                ->where('key', 'consultation_booking_promotion_claimed_count')
                ->value('value'));
            $this->assertDatabaseCount('consultation_bookings', 0);
        }
    }

    public function test_missing_launch_counter_fails_closed(): void
    {
        Mail::fake();
        ConsultationSetting::query()
            ->where('key', 'consultation_booking_promotion_claimed_count')
            ->delete();

        $tier = ConsultationTier::query()->where('slug', 'light')->firstOrFail();
        $booking = $this->app->make(BookingWorkflowService::class)->requestBooking(
            $tier,
            'Counter recovery customer',
            'counter-recovery@example.com',
            null,
            $this->nextWeekdayAt(10),
        )['booking']->fresh();

        $this->assertSame(0, $booking->campaign_discount_cents);
        $this->assertSame(44900, $booking->amount_due_cents);
    }

    public function test_failed_booking_transaction_restores_the_launch_discount_claim(): void
    {
        $notifications = $this->createMock(ConsultationNotificationService::class);
        $notifications->expects($this->once())
            ->method('enqueue')
            ->willThrowException(new \RuntimeException('notification failure'));
        $this->app->instance(ConsultationNotificationService::class, $notifications);

        $tier = ConsultationTier::query()->where('slug', 'light')->firstOrFail();

        $this->expectException(\RuntimeException::class);

        try {
            $this->app->make(BookingWorkflowService::class)->requestBooking(
                $tier,
                'Rollback customer',
                'rollback@example.com',
                null,
                $this->nextWeekdayAt(10),
            );
        } finally {
            $this->assertSame('0', ConsultationSetting::query()
                ->where('key', 'consultation_booking_promotion_claimed_count')
                ->value('value'));
            $this->assertDatabaseCount('consultation_bookings', 0);
        }
    }

    public function test_a_paid_reschedule_does_not_redeem_coupon_again(): void
    {
        Mail::fake();

        $startsAt = now('UTC')->addDays(3)->setTime(10, 0);
        ConsultationAvailabilityWindow::create([
            'weekday' => $startsAt->dayOfWeek,
            'start_time' => '09:00:00',
            'end_time' => '12:00:00',
            'is_active' => true,
        ]);

        $google = $this->createMock(GoogleCalendarService::class);
        $google->method('busyPeriods')->willReturn([]);
        $google->expects($this->once())->method('deleteEvent')->with('old-event')->willReturn(true);
        $google->expects($this->once())->method('createConfirmedEvent')->willReturn([
            'event_id' => 'new-event',
            'meet_link' => 'https://meet.google.com/new-room',
            'conference_id' => 'new-room',
        ]);
        $this->app->instance(GoogleCalendarService::class, $google);

        $tier = ConsultationTier::query()->where('slug', 'light')->firstOrFail();
        $coupon = ConsultationCoupon::create([
            'code' => 'RESCHEDULE20',
            'percent_off' => 20,
            'tier_slugs' => [$tier->slug],
            'redeemed_count' => 1,
            'is_active' => true,
        ]);

        $booking = ConsultationBooking::create([
            'consultation_tier_id' => $tier->id,
            'consultation_coupon_id' => $coupon->id,
            'client_name' => 'Ada Lovelace',
            'client_email' => 'ada@example.com',
            'starts_at' => $startsAt,
            'ends_at' => $startsAt->copy()->addMinutes($tier->duration_minutes),
            'status' => ConsultationBooking::STATUS_PENDING_APPROVAL,
            'list_price_cents' => $tier->price_cents,
            'discount_percent' => $coupon->percent_off,
            'amount_due_cents' => $coupon->discountedAmountCents($tier->price_cents),
            'currency' => 'usd',
            'google_event_id' => 'old-event',
            'confirmed_at' => now('UTC')->subDay(),
            'hold_expires_at' => now('UTC')->addHours(48),
            'payment_due_at' => $startsAt->copy()->subDay(),
            'access_token_hash' => hash('sha256', 'reschedule-token'),
        ]);

        $workflow = $this->app->make(BookingWorkflowService::class);
        $workflow->approve($booking);

        $this->assertDatabaseHas('consultation_bookings', [
            'id' => $booking->id,
            'status' => ConsultationBooking::STATUS_CONFIRMED,
        ]);
        $this->assertSame(1, $coupon->fresh()->redeemed_count);
    }

    public function test_coupon_redemption_limit_is_enforced_when_confirming(): void
    {
        Mail::fake();

        $tier = ConsultationTier::query()->where('slug', 'light')->firstOrFail();
        $coupon = ConsultationCoupon::create([
            'code' => 'LIMITED20',
            'percent_off' => 20,
            'tier_slugs' => [$tier->slug],
            'max_redemptions' => 1,
            'redeemed_count' => 1,
            'is_active' => true,
        ]);
        $booking = ConsultationBooking::create([
            'consultation_tier_id' => $tier->id,
            'consultation_coupon_id' => $coupon->id,
            'client_name' => 'Coupon user',
            'client_email' => 'coupon@example.com',
            'starts_at' => now('UTC')->addDays(3)->setTime(10, 0),
            'ends_at' => now('UTC')->addDays(3)->setTime(10, 30),
            'status' => ConsultationBooking::STATUS_PENDING_APPROVAL,
            'list_price_cents' => $tier->price_cents,
            'discount_percent' => 20,
            'amount_due_cents' => 0,
            'currency' => 'usd',
            'access_token_hash' => hash('sha256', 'coupon-limit'),
        ]);

        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('redemption limit');

        try {
            $this->app->make(BookingWorkflowService::class)->confirmBooking($booking);
        } finally {
            $this->assertSame(
                ConsultationBooking::STATUS_PENDING_APPROVAL,
                $booking->fresh()->status,
            );
            $this->assertSame(1, $coupon->fresh()->redeemed_count);
        }
    }

    public function test_connected_google_failure_does_not_confirm_a_booking(): void
    {
        Mail::fake();

        $google = $this->createMock(GoogleCalendarService::class);
        $google->method('isConnected')->willReturn(true);
        $google->expects($this->once())->method('createConfirmedEvent')->willReturn(null);
        $this->app->instance(GoogleCalendarService::class, $google);

        $tier = ConsultationTier::query()->where('slug', 'light')->firstOrFail();
        $booking = ConsultationBooking::create([
            'consultation_tier_id' => $tier->id,
            'client_name' => 'Calendar failure',
            'client_email' => 'calendar-failure@example.com',
            'starts_at' => now('UTC')->addDays(3)->setTime(10, 0),
            'ends_at' => now('UTC')->addDays(3)->setTime(10, 30),
            'status' => ConsultationBooking::STATUS_PENDING_APPROVAL,
            'list_price_cents' => $tier->price_cents,
            'amount_due_cents' => 0,
            'currency' => 'usd',
            'hold_expires_at' => now('UTC')->addDay(),
            'payment_due_at' => now('UTC')->addDays(2),
            'access_token_hash' => hash('sha256', 'calendar-failure'),
        ]);

        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('Google Calendar');

        try {
            $this->app->make(BookingWorkflowService::class)->confirmBooking($booking);
        } finally {
            $this->assertSame(ConsultationBooking::STATUS_PENDING_APPROVAL, $booking->fresh()->status);
        }
    }

    public function test_pending_google_meet_is_completed_before_confirmation_mail_is_sent(): void
    {
        Mail::fake();

        $google = $this->createMock(GoogleCalendarService::class);
        $google->method('isConnected')->willReturn(true);
        $google->expects($this->once())->method('createConfirmedEvent')->willReturn([
            'event_id' => 'pending-meet-event',
            'meet_link' => null,
            'conference_id' => 'pending-conference',
        ]);
        $google->expects($this->once())->method('confirmedEventDetails')->with('pending-meet-event')->willReturn([
            'event_id' => 'pending-meet-event',
            'meet_link' => 'https://meet.google.com/pending-room',
            'conference_id' => 'pending-conference',
        ]);
        $this->app->instance(GoogleCalendarService::class, $google);

        $tier = ConsultationTier::query()->where('slug', 'light')->firstOrFail();
        $booking = ConsultationBooking::create([
            'consultation_tier_id' => $tier->id,
            'client_name' => 'Pending Meet',
            'client_email' => 'pending-meet@example.com',
            'starts_at' => now('UTC')->addDays(3)->setTime(10, 0),
            'ends_at' => now('UTC')->addDays(3)->setTime(10, 30),
            'status' => ConsultationBooking::STATUS_PENDING_APPROVAL,
            'list_price_cents' => $tier->price_cents,
            'amount_due_cents' => 0,
            'currency' => 'usd',
            'hold_expires_at' => now('UTC')->addDay(),
            'payment_due_at' => now('UTC')->addDay(),
            'access_token_hash' => hash('sha256', 'pending-meet-token'),
        ]);

        $workflow = $this->app->make(BookingWorkflowService::class);
        $result = $workflow->confirmBooking($booking);

        $this->assertSame(ConsultationBooking::STATUS_CONFIRMED, $result->status);
        $this->assertNull($result->meet_link);
        $this->assertDatabaseHas('consultation_google_operations', [
            'consultation_booking_id' => $booking->id,
            'operation' => 'meet_link',
            'status' => ConsultationGoogleOperation::STATUS_PENDING,
        ]);
        Mail::assertNotSent(BookingConfirmedMail::class);

        $this->assertSame(1, app(ConsultationGoogleOperationService::class)->retryDue($workflow));
        $this->assertSame('https://meet.google.com/pending-room', $booking->fresh()->meet_link);
        $this->assertSame(
            ConsultationGoogleOperation::STATUS_SUCCEEDED,
            $booking->googleOperations()->where('operation', 'meet_link')->firstOrFail()->status,
        );
        Mail::assertSent(BookingConfirmedMail::class);
    }

    public function test_denied_cancellation_notifies_the_client_and_keeps_the_booking_confirmed(): void
    {
        Mail::fake();

        $tier = ConsultationTier::query()->where('slug', 'light')->firstOrFail();
        $booking = ConsultationBooking::create([
            'consultation_tier_id' => $tier->id,
            'client_name' => 'Cancellation denial',
            'client_email' => 'cancel-denial@example.com',
            'starts_at' => now('UTC')->addDays(3)->setTime(10, 0),
            'ends_at' => now('UTC')->addDays(3)->setTime(10, 30),
            'status' => ConsultationBooking::STATUS_CANCEL_REQUESTED,
            'list_price_cents' => $tier->price_cents,
            'amount_due_cents' => $tier->price_cents,
            'currency' => 'usd',
            'access_token_hash' => hash('sha256', 'cancel-denial'),
        ]);

        $result = $this->app->make(BookingWorkflowService::class)->denyCancel($booking);

        $this->assertSame(ConsultationBooking::STATUS_CONFIRMED, $result->status);
        Mail::assertSent(BookingCancellationDeniedMail::class, fn ($mail) => $mail->booking->is($booking));
    }

    public function test_cancellation_approval_fence_blocks_denial_while_calendar_cleanup_is_pending(): void
    {
        $google = $this->createMock(GoogleCalendarService::class);
        $google->expects($this->once())->method('deleteEvent')->with('pending-cancel-event')->willReturn(false);
        $this->app->instance(GoogleCalendarService::class, $google);

        $tier = ConsultationTier::query()->where('slug', 'light')->firstOrFail();
        $booking = ConsultationBooking::create([
            'consultation_tier_id' => $tier->id,
            'client_name' => 'Pending cancellation',
            'client_email' => 'pending-cancellation@example.com',
            'starts_at' => now('UTC')->addDays(3)->setTime(10, 0),
            'ends_at' => now('UTC')->addDays(3)->setTime(10, 30),
            'status' => ConsultationBooking::STATUS_CANCEL_REQUESTED,
            'list_price_cents' => $tier->price_cents,
            'amount_due_cents' => 0,
            'currency' => 'usd',
            'google_event_id' => 'pending-cancel-event',
            'access_token_hash' => hash('sha256', 'pending-cancellation'),
        ]);

        try {
            $this->app->make(BookingWorkflowService::class)->approveCancel($booking);
            $this->fail('Cancellation approval should wait for calendar cleanup.');
        } catch (\RuntimeException $e) {
            $this->assertStringContainsString('release the cancelled consultation', $e->getMessage());
        }

        $fresh = $booking->fresh();
        $this->assertSame(ConsultationBooking::STATUS_CANCEL_REQUESTED, $fresh->status);
        $this->assertNotNull($fresh->cancel_approval_started_at);

        try {
            $this->app->make(BookingWorkflowService::class)->denyCancel($fresh);
            $this->fail('Cancellation denial must not race approval cleanup.');
        } catch (\InvalidArgumentException $e) {
            $this->assertSame('Cancellation approval has started and cannot be denied.', $e->getMessage());
        }
    }

    public function test_denied_reschedule_notifies_the_client_and_keeps_the_booking_confirmed(): void
    {
        Mail::fake();

        $tier = ConsultationTier::query()->where('slug', 'light')->firstOrFail();
        $booking = ConsultationBooking::create([
            'consultation_tier_id' => $tier->id,
            'client_name' => 'Reschedule denial',
            'client_email' => 'reschedule-denial@example.com',
            'starts_at' => now('UTC')->addDays(3)->setTime(10, 0),
            'ends_at' => now('UTC')->addDays(3)->setTime(10, 30),
            'status' => ConsultationBooking::STATUS_RESCHEDULE_REQUESTED,
            'list_price_cents' => $tier->price_cents,
            'amount_due_cents' => $tier->price_cents,
            'currency' => 'usd',
            'access_token_hash' => hash('sha256', 'reschedule-denial'),
        ]);

        $result = $this->app->make(BookingWorkflowService::class)->denyReschedule($booking);

        $this->assertSame(ConsultationBooking::STATUS_CONFIRMED, $result->status);
        Mail::assertSent(BookingRescheduleDeniedMail::class, fn ($mail) => $mail->booking->is($booking));
    }

    public function test_decline_keeps_a_booking_pending_when_google_cannot_apply_the_decision(): void
    {
        $google = $this->createMock(GoogleCalendarService::class);
        $google->method('isConnected')->willReturn(true);
        $google->expects($this->once())->method('updateEvent')->willReturn(null);
        $this->app->instance(GoogleCalendarService::class, $google);

        $tier = ConsultationTier::query()->where('slug', 'light')->firstOrFail();
        $booking = ConsultationBooking::create([
            'consultation_tier_id' => $tier->id,
            'client_name' => 'Google retry',
            'client_email' => 'google-retry@example.com',
            'starts_at' => now('UTC')->addDays(3)->setTime(10, 0),
            'ends_at' => now('UTC')->addDays(3)->setTime(10, 30),
            'status' => ConsultationBooking::STATUS_PENDING_APPROVAL,
            'list_price_cents' => $tier->price_cents,
            'amount_due_cents' => $tier->price_cents,
            'currency' => 'usd',
            'google_event_id' => 'hold-event',
            'access_token_hash' => hash('sha256', 'google-retry'),
        ]);

        $this->expectException(\RuntimeException::class);

        try {
            $this->app->make(BookingWorkflowService::class)->decline($booking, true, 'Blocked time');
        } finally {
            $this->assertSame(
                ConsultationBooking::STATUS_PENDING_APPROVAL,
                $booking->fresh()->status,
            );
        }
    }

    public function test_decline_does_not_claim_a_slot_is_blocked_when_google_is_disconnected(): void
    {
        $google = $this->createMock(GoogleCalendarService::class);
        $google->method('isConnected')->willReturn(false);
        $google->expects($this->once())->method('createHoldEvent')->willReturn(null);
        $this->app->instance(GoogleCalendarService::class, $google);

        $tier = ConsultationTier::query()->where('slug', 'light')->firstOrFail();
        $startsAt = now('UTC')->addDays(3)->setTime(10, 0);
        $booking = ConsultationBooking::create([
            'consultation_tier_id' => $tier->id,
            'client_name' => 'Disconnected calendar block',
            'client_email' => 'disconnected-block@example.com',
            'starts_at' => $startsAt,
            'ends_at' => $startsAt->copy()->addMinutes($tier->duration_minutes),
            'status' => ConsultationBooking::STATUS_PENDING_APPROVAL,
            'list_price_cents' => $tier->price_cents,
            'amount_due_cents' => $tier->price_cents,
            'currency' => 'usd',
            'access_token_hash' => hash('sha256', 'disconnected-block'),
        ]);

        try {
            $this->app->make(BookingWorkflowService::class)->decline($booking, true, 'Blocked time');
            $this->fail('A disconnected calendar must not confirm a blocked decline.');
        } catch (\RuntimeException $e) {
            $this->assertStringContainsString('block the declined slot', $e->getMessage());
        }

        $this->assertSame(ConsultationBooking::STATUS_PENDING_APPROVAL, $booking->fresh()->status);
    }

    public function test_paid_reschedule_decline_restores_the_original_appointment_without_refunding(): void
    {
        Mail::fake();

        $google = $this->createMock(GoogleCalendarService::class);
        $google->expects($this->once())->method('deleteEvent')->with('reschedule-hold')->willReturn(true);
        $google->method('isConnected')->willReturn(true);
        $this->app->instance(GoogleCalendarService::class, $google);

        $tier = ConsultationTier::query()->where('slug', 'light')->firstOrFail();
        $originalStartsAt = now('UTC')->addDays(3)->setTime(10, 0);
        $newStartsAt = $originalStartsAt->copy()->addDay();
        $originalPaymentDueAt = $originalStartsAt->copy()->subHours(24)->subMinutes(7);
        $originalAccessTokenExpiresAt = $originalStartsAt->copy()->addMinutes($tier->duration_minutes)->addDays(120);
        $booking = ConsultationBooking::create([
            'consultation_tier_id' => $tier->id,
            'client_name' => 'Paid reschedule decline',
            'client_email' => 'paid-reschedule-decline@example.com',
            'starts_at' => $newStartsAt,
            'ends_at' => $newStartsAt->copy()->addMinutes($tier->duration_minutes),
            'status' => ConsultationBooking::STATUS_PAID_RESCHEDULE_PENDING_APPROVAL,
            'list_price_cents' => $tier->price_cents,
            'amount_due_cents' => $tier->price_cents,
            'currency' => 'usd',
            'confirmed_at' => now('UTC')->subDay(),
            'google_event_id' => 'original-event',
            'reschedule_hold_event_id' => 'reschedule-hold',
            'reschedule_original_starts_at' => $originalStartsAt,
            'reschedule_original_ends_at' => $originalStartsAt->copy()->addMinutes($tier->duration_minutes),
            'reschedule_original_payment_due_at' => $originalPaymentDueAt,
            'reschedule_original_access_token_expires_at' => $originalAccessTokenExpiresAt,
            'payment_due_at' => $newStartsAt->copy()->subHours(24),
            'access_token_expires_at' => $newStartsAt->copy()->addMinutes($tier->duration_minutes)->addDays(90),
            'hold_expires_at' => now('UTC')->addDay(),
            'access_token_hash' => hash('sha256', 'paid-reschedule-decline'),
        ]);

        $result = $this->app->make(BookingWorkflowService::class)->decline($booking);

        $this->assertSame(ConsultationBooking::STATUS_CONFIRMED, $result->status);
        $this->assertTrue($result->starts_at->equalTo($originalStartsAt));
        $this->assertSame('original-event', $result->google_event_id);
        $this->assertNull($result->reschedule_hold_event_id);
        $this->assertTrue($result->payment_due_at->equalTo($originalPaymentDueAt));
        $this->assertTrue($result->access_token_expires_at->equalTo($originalAccessTokenExpiresAt));
        Mail::assertSent(BookingRescheduleDeniedMail::class);
    }

    public function test_paid_reschedule_approval_replaces_both_calendar_events_without_checkout(): void
    {
        Mail::fake();

        $originalStartsAt = now('UTC')->addDays(3)->setTime(10, 0);
        $newStartsAt = $originalStartsAt->copy()->addDay();
        ConsultationAvailabilityWindow::create([
            'weekday' => $newStartsAt->dayOfWeek,
            'start_time' => '09:00:00',
            'end_time' => '12:00:00',
            'is_active' => true,
        ]);

        $deletedEvents = [];
        $google = $this->createMock(GoogleCalendarService::class);
        $google->expects($this->once())
            ->method('busyPeriods')
            ->with(
                $this->isInstanceOf(Carbon::class),
                $this->isInstanceOf(Carbon::class),
                ['original-approval-event', 'reschedule-approval-hold'],
            )
            ->willReturn([]);
        $google->expects($this->once())
            ->method('createConfirmedEvent')
            ->willReturn([
                'event_id' => 'replacement-event',
                'meet_link' => 'https://meet.google.com/replacement',
                'conference_id' => 'replacement',
            ]);
        $google->expects($this->exactly(2))
            ->method('deleteEvent')
            ->willReturnCallback(function (?string $eventId) use (&$deletedEvents): bool {
                $deletedEvents[] = $eventId;

                return true;
            });
        $google->method('isConnected')->willReturn(true);
        $this->app->instance(GoogleCalendarService::class, $google);

        $tier = ConsultationTier::query()->where('slug', 'light')->firstOrFail();
        $booking = ConsultationBooking::create([
            'consultation_tier_id' => $tier->id,
            'client_name' => 'Paid reschedule approval',
            'client_email' => 'paid-reschedule-approval@example.com',
            'starts_at' => $newStartsAt,
            'ends_at' => $newStartsAt->copy()->addMinutes($tier->duration_minutes),
            'status' => ConsultationBooking::STATUS_PAID_RESCHEDULE_PENDING_APPROVAL,
            'list_price_cents' => $tier->price_cents,
            'amount_due_cents' => $tier->price_cents,
            'currency' => 'usd',
            'confirmed_at' => now('UTC')->subDay(),
            'google_event_id' => 'original-approval-event',
            'reschedule_hold_event_id' => 'reschedule-approval-hold',
            'reschedule_original_starts_at' => $originalStartsAt,
            'reschedule_original_ends_at' => $originalStartsAt->copy()->addMinutes($tier->duration_minutes),
            'hold_expires_at' => now('UTC')->addDay(),
            'access_token_hash' => hash('sha256', 'paid-reschedule-approval'),
        ]);

        $result = $this->app->make(BookingWorkflowService::class)->approve($booking);

        $this->assertSame(ConsultationBooking::STATUS_CONFIRMED, $result->status);
        $this->assertSame('replacement-event', $result->google_event_id);
        $this->assertTrue($result->starts_at->equalTo($newStartsAt));
        $this->assertSame([
            'original-approval-event',
            'reschedule-approval-hold',
        ], $deletedEvents);
    }

    public function test_paid_reschedule_expiry_restores_the_original_appointment(): void
    {
        Mail::fake();

        $google = $this->createMock(GoogleCalendarService::class);
        $google->expects($this->once())->method('deleteEvent')->with('expired-reschedule-hold')->willReturn(true);
        $google->method('isConnected')->willReturn(true);
        $this->app->instance(GoogleCalendarService::class, $google);

        $tier = ConsultationTier::query()->where('slug', 'light')->firstOrFail();
        $originalStartsAt = now('UTC')->addDays(3)->setTime(10, 0);
        $newStartsAt = $originalStartsAt->copy()->addDay();
        $originalPaymentDueAt = $originalStartsAt->copy()->subHours(24)->subMinutes(11);
        $originalAccessTokenExpiresAt = $originalStartsAt->copy()->addMinutes($tier->duration_minutes)->addDays(121);
        $booking = ConsultationBooking::create([
            'consultation_tier_id' => $tier->id,
            'client_name' => 'Paid reschedule expiry',
            'client_email' => 'paid-reschedule-expiry@example.com',
            'starts_at' => $newStartsAt,
            'ends_at' => $newStartsAt->copy()->addMinutes($tier->duration_minutes),
            'status' => ConsultationBooking::STATUS_PAID_RESCHEDULE_PENDING_APPROVAL,
            'list_price_cents' => $tier->price_cents,
            'amount_due_cents' => $tier->price_cents,
            'currency' => 'usd',
            'confirmed_at' => now('UTC')->subDay(),
            'google_event_id' => 'original-expiry-event',
            'reschedule_hold_event_id' => 'expired-reschedule-hold',
            'reschedule_original_starts_at' => $originalStartsAt,
            'reschedule_original_ends_at' => $originalStartsAt->copy()->addMinutes($tier->duration_minutes),
            'reschedule_original_payment_due_at' => $originalPaymentDueAt,
            'reschedule_original_access_token_expires_at' => $originalAccessTokenExpiresAt,
            'payment_due_at' => $newStartsAt->copy()->subHours(24),
            'access_token_expires_at' => $newStartsAt->copy()->addMinutes($tier->duration_minutes)->addDays(90),
            'hold_expires_at' => now('UTC')->subMinute(),
            'access_token_hash' => hash('sha256', 'paid-reschedule-expiry'),
        ]);

        $this->assertSame(1, $this->app->make(BookingWorkflowService::class)->expireStaleHolds());

        $result = $booking->fresh();
        $this->assertSame(ConsultationBooking::STATUS_CONFIRMED, $result->status);
        $this->assertTrue($result->starts_at->equalTo($originalStartsAt));
        $this->assertSame('original-expiry-event', $result->google_event_id);
        $this->assertTrue($result->payment_due_at->equalTo($originalPaymentDueAt));
        $this->assertTrue($result->access_token_expires_at->equalTo($originalAccessTokenExpiresAt));
        Mail::assertSent(BookingRescheduleDeniedMail::class);
    }

    public function test_paid_reschedule_pick_preserves_the_original_calendar_event_until_approval(): void
    {
        Mail::fake();

        $originalStartsAt = now('UTC')->addDays(3)->setTime(10, 0);
        $newStartsAt = $originalStartsAt->copy()->addDay();
        $originalPaymentDueAt = $originalStartsAt->copy()->subHours(24);
        $originalAccessTokenExpiresAt = $originalStartsAt->copy()->addMinutes(60)->addDays(90);
        ConsultationAvailabilityWindow::create([
            'weekday' => $newStartsAt->dayOfWeek,
            'start_time' => '09:00:00',
            'end_time' => '12:00:00',
            'is_active' => true,
        ]);

        $google = $this->createMock(GoogleCalendarService::class);
        $google->expects($this->once())->method('busyPeriods')->willReturn([]);
        $google->expects($this->once())
            ->method('createHoldEvent')
            ->with(
                $this->anything(),
                $this->isInstanceOf(Carbon::class),
                $this->isInstanceOf(Carbon::class),
                'Reschedule pick pending approval',
                $this->callback(fn (string $key): bool => str_starts_with($key, 'consultation-booking-') && str_contains($key, '-reschedule-')),
            )
            ->willReturn('new-reschedule-hold');
        $google->method('isConnected')->willReturn(true);
        $this->app->instance(GoogleCalendarService::class, $google);

        $tier = ConsultationTier::query()->where('slug', 'light')->firstOrFail();
        $booking = ConsultationBooking::create([
            'consultation_tier_id' => $tier->id,
            'client_name' => 'Paid reschedule pick',
            'client_email' => 'paid-reschedule-pick@example.com',
            'starts_at' => $originalStartsAt,
            'ends_at' => $originalStartsAt->copy()->addMinutes($tier->duration_minutes),
            'status' => ConsultationBooking::STATUS_RESCHEDULE_PROPOSED,
            'list_price_cents' => $tier->price_cents,
            'amount_due_cents' => $tier->price_cents,
            'currency' => 'usd',
            'confirmed_at' => now('UTC')->subDay(),
            'google_event_id' => 'original-pick-event',
            'payment_due_at' => $originalPaymentDueAt,
            'access_token_expires_at' => $originalAccessTokenExpiresAt,
            'proposed_slots' => [[
                'start' => $newStartsAt->toIso8601String(),
                'end' => $newStartsAt->copy()->addMinutes($tier->duration_minutes)->toIso8601String(),
            ]],
            'hold_expires_at' => now('UTC')->addDay(),
            'access_token_hash' => hash('sha256', 'paid-reschedule-pick'),
        ]);

        $result = $this->app->make(BookingWorkflowService::class)->clientPickProposedSlot($booking, $newStartsAt);

        $this->assertSame(ConsultationBooking::STATUS_PAID_RESCHEDULE_PENDING_APPROVAL, $result->status);
        $this->assertSame('original-pick-event', $result->google_event_id);
        $this->assertSame('new-reschedule-hold', $result->reschedule_hold_event_id);
        $this->assertTrue($result->reschedule_original_starts_at->equalTo($originalStartsAt));
        $this->assertTrue($result->reschedule_original_payment_due_at->equalTo($originalPaymentDueAt));
        $this->assertTrue($result->reschedule_original_access_token_expires_at->equalTo($originalAccessTokenExpiresAt));
        $this->assertTrue($result->payment_due_at->equalTo($newStartsAt->copy()->subHours(24)));
        $this->assertSame(
            $newStartsAt->copy()->addMinutes(60)->addDays(90)->timestamp,
            $result->access_token_expires_at->timestamp,
        );
    }

    public function test_an_expired_reschedule_proposal_cannot_be_picked(): void
    {
        $google = $this->createMock(GoogleCalendarService::class);
        $google->expects($this->never())->method('deleteEvent');
        $google->expects($this->never())->method('createHoldEvent');
        $this->app->instance(GoogleCalendarService::class, $google);

        $tier = ConsultationTier::query()->where('slug', 'light')->firstOrFail();
        $startsAt = now('UTC')->addDays(3)->setTime(10, 0);
        $booking = ConsultationBooking::create([
            'consultation_tier_id' => $tier->id,
            'client_name' => 'Expired proposal',
            'client_email' => 'expired-proposal@example.com',
            'starts_at' => $startsAt,
            'ends_at' => $startsAt->copy()->addMinutes($tier->duration_minutes),
            'status' => ConsultationBooking::STATUS_RESCHEDULE_PROPOSED,
            'list_price_cents' => $tier->price_cents,
            'amount_due_cents' => $tier->price_cents,
            'currency' => 'usd',
            'proposed_slots' => [[
                'start' => $startsAt->copy()->addDay()->toIso8601String(),
                'end' => $startsAt->copy()->addDay()->addMinutes($tier->duration_minutes)->toIso8601String(),
            ]],
            'hold_expires_at' => now('UTC')->subMinute(),
            'access_token_hash' => hash('sha256', 'expired-proposal'),
        ]);

        try {
            $this->app->make(BookingWorkflowService::class)->clientPickProposedSlot(
                $booking,
                $startsAt->copy()->addDay(),
            );
            $this->fail('An expired reschedule proposal must not be picked.');
        } catch (\InvalidArgumentException $e) {
            $this->assertStringContainsString('proposal has expired', $e->getMessage());
        }

        $this->assertSame(ConsultationBooking::STATUS_RESCHEDULE_PROPOSED, $booking->fresh()->status);
    }

    public function test_an_expired_booking_hold_cannot_receive_a_reschedule_proposal(): void
    {
        $tier = ConsultationTier::query()->where('slug', 'light')->firstOrFail();
        $startsAt = now('UTC')->addDays(3)->setTime(10, 0);
        $booking = ConsultationBooking::create([
            'consultation_tier_id' => $tier->id,
            'client_name' => 'Expired booking hold',
            'client_email' => 'expired-booking@example.com',
            'starts_at' => $startsAt,
            'ends_at' => $startsAt->copy()->addMinutes($tier->duration_minutes),
            'status' => ConsultationBooking::STATUS_PENDING_APPROVAL,
            'list_price_cents' => $tier->price_cents,
            'amount_due_cents' => $tier->price_cents,
            'currency' => 'usd',
            'hold_expires_at' => now('UTC')->subMinute(),
            'access_token_hash' => hash('sha256', 'expired-booking'),
        ]);

        try {
            $this->app->make(BookingWorkflowService::class)->proposeReschedule($booking, [[
                'start' => $startsAt->copy()->addDay()->toIso8601String(),
                'end' => $startsAt->copy()->addDay()->addMinutes($tier->duration_minutes)->toIso8601String(),
            ]]);
            $this->fail('An expired booking hold must not receive a reschedule proposal.');
        } catch (\InvalidArgumentException $e) {
            $this->assertStringContainsString('booking hold has expired', $e->getMessage());
        }

        $this->assertSame(ConsultationBooking::STATUS_PENDING_APPROVAL, $booking->fresh()->status);
    }

    public function test_unpaid_reschedule_pick_uses_a_new_calendar_hold_key(): void
    {
        Mail::fake();

        $originalStartsAt = now('UTC')->addDays(3)->setTime(10, 0);
        $newStartsAt = $originalStartsAt->copy()->addDay();
        ConsultationAvailabilityWindow::create([
            'weekday' => $newStartsAt->dayOfWeek,
            'start_time' => '09:00:00',
            'end_time' => '12:00:00',
            'is_active' => true,
        ]);

        $google = $this->createMock(GoogleCalendarService::class);
        $google->expects($this->once())->method('busyPeriods')->willReturn([]);
        $google->expects($this->once())->method('deleteEvent')->with('old-unpaid-event')->willReturn(true);
        $google->expects($this->once())
            ->method('createHoldEvent')
            ->with(
                $this->anything(),
                $this->isInstanceOf(Carbon::class),
                $this->isInstanceOf(Carbon::class),
                'Reschedule pick pending approval',
                $this->callback(fn (string $key): bool => str_starts_with($key, 'consultation-booking-') && str_contains($key, '-reschedule-')),
            )
            ->willReturn('new-unpaid-event');
        $google->method('isConnected')->willReturn(true);
        $this->app->instance(GoogleCalendarService::class, $google);

        $tier = ConsultationTier::query()->where('slug', 'light')->firstOrFail();
        $booking = ConsultationBooking::create([
            'consultation_tier_id' => $tier->id,
            'client_name' => 'Unpaid reschedule pick',
            'client_email' => 'unpaid-reschedule-pick@example.com',
            'starts_at' => $originalStartsAt,
            'ends_at' => $originalStartsAt->copy()->addMinutes($tier->duration_minutes),
            'status' => ConsultationBooking::STATUS_RESCHEDULE_PROPOSED,
            'list_price_cents' => $tier->price_cents,
            'amount_due_cents' => $tier->price_cents,
            'currency' => 'usd',
            'google_event_id' => 'old-unpaid-event',
            'proposed_slots' => [[
                'start' => $newStartsAt->toIso8601String(),
                'end' => $newStartsAt->copy()->addMinutes($tier->duration_minutes)->toIso8601String(),
            ]],
            'hold_expires_at' => now('UTC')->addDay(),
            'access_token_hash' => hash('sha256', 'unpaid-reschedule-pick'),
        ]);

        $result = $this->app->make(BookingWorkflowService::class)->clientPickProposedSlot($booking, $newStartsAt);

        $this->assertSame(ConsultationBooking::STATUS_PENDING_APPROVAL, $result->status);
        $this->assertSame('new-unpaid-event', $result->google_event_id);
    }

    public function test_a_failed_google_transition_is_replayed_by_the_operation_worker(): void
    {
        Mail::fake();

        $google = $this->createMock(GoogleCalendarService::class);
        $google->expects($this->once())
            ->method('updateEvent')
            ->with(
                'retry-hold',
                'Blocked time',
                $this->isInstanceOf(Carbon::class),
                $this->isInstanceOf(Carbon::class),
                'Blocked after declining a consultation request.',
                'confirmed',
            )
            ->willReturn('retry-hold');
        $google->method('isConnected')->willReturn(true);
        $this->app->instance(GoogleCalendarService::class, $google);

        $tier = ConsultationTier::query()->where('slug', 'light')->firstOrFail();
        $booking = ConsultationBooking::create([
            'consultation_tier_id' => $tier->id,
            'client_name' => 'Google operation retry',
            'client_email' => 'google-operation@example.com',
            'starts_at' => now('UTC')->addDays(3)->setTime(10, 0),
            'ends_at' => now('UTC')->addDays(3)->setTime(10, 30),
            'status' => ConsultationBooking::STATUS_PENDING_APPROVAL,
            'list_price_cents' => $tier->price_cents,
            'amount_due_cents' => $tier->price_cents,
            'currency' => 'usd',
            'google_event_id' => 'retry-hold',
            'access_token_hash' => hash('sha256', 'google-operation-retry'),
        ]);
        $operation = ConsultationGoogleOperation::create([
            'consultation_booking_id' => $booking->id,
            'operation_key' => 'consultation-booking-'.$booking->id.'-google-decline',
            'operation' => 'decline',
            'payload' => [
                'block_slot' => true,
                'task_title' => 'Blocked time',
            ],
            'status' => ConsultationGoogleOperation::STATUS_FAILED,
            'attempts' => 1,
            'available_at' => now('UTC')->subMinute(),
        ]);

        $this->assertSame(
            1,
            app(ConsultationGoogleOperationService::class)->retryDue(
                app(BookingWorkflowService::class),
            ),
        );
        $this->assertSame(ConsultationBooking::STATUS_DECLINED, $booking->fresh()->status);
        $this->assertSame(
            ConsultationGoogleOperation::STATUS_SUCCEEDED,
            $operation->fresh()->status,
        );
    }

    public function test_a_stale_meet_recording_operation_is_not_sent_to_google(): void
    {
        $google = $this->createMock(GoogleCalendarService::class);
        $google->expects($this->never())->method('enableMeetAutoRecording');
        $this->app->instance(GoogleCalendarService::class, $google);

        $tier = ConsultationTier::query()->where('slug', 'max')->firstOrFail();
        $booking = ConsultationBooking::create([
            'consultation_tier_id' => $tier->id,
            'client_name' => 'Stale recording operation',
            'client_email' => 'stale-recording@example.com',
            'starts_at' => now('UTC')->addDays(3)->setTime(10, 0),
            'ends_at' => now('UTC')->addDays(3)->setTime(11, 0),
            'status' => ConsultationBooking::STATUS_CONFIRMED,
            'list_price_cents' => $tier->price_cents,
            'amount_due_cents' => $tier->price_cents,
            'currency' => 'usd',
            'google_event_id' => 'replacement-event',
            'meet_link' => 'https://meet.google.com/replacement-room',
            'access_token_hash' => hash('sha256', 'stale-recording'),
        ]);
        $operation = ConsultationGoogleOperation::create([
            'consultation_booking_id' => $booking->id,
            'operation_key' => 'consultation-booking-'.$booking->id.'-google-meet_recording-old',
            'operation' => 'meet_recording',
            'payload' => [
                'event_id' => 'old-event',
                'meet_link' => 'https://meet.google.com/old-room',
            ],
            'status' => ConsultationGoogleOperation::STATUS_FAILED,
            'attempts' => 1,
            'available_at' => now('UTC')->subMinute(),
        ]);

        $this->assertSame(
            0,
            app(ConsultationGoogleOperationService::class)->retryDue(
                app(BookingWorkflowService::class),
            ),
        );
        $this->assertSame(
            ConsultationGoogleOperation::STATUS_NEEDS_ATTENTION,
            $operation->fresh()->status,
        );
    }

    public function test_a_legacy_meet_recording_operation_without_an_event_fence_is_quarantined(): void
    {
        $google = $this->createMock(GoogleCalendarService::class);
        $google->expects($this->never())->method('enableMeetAutoRecording');
        $this->app->instance(GoogleCalendarService::class, $google);

        $tier = ConsultationTier::query()->where('slug', 'max')->firstOrFail();
        $booking = ConsultationBooking::create([
            'consultation_tier_id' => $tier->id,
            'client_name' => 'Legacy recording operation',
            'client_email' => 'legacy-recording@example.com',
            'starts_at' => now('UTC')->addDays(3)->setTime(10, 0),
            'ends_at' => now('UTC')->addDays(3)->setTime(11, 0),
            'status' => ConsultationBooking::STATUS_CONFIRMED,
            'list_price_cents' => $tier->price_cents,
            'amount_due_cents' => $tier->price_cents,
            'currency' => 'usd',
            'google_event_id' => 'legacy-current-event',
            'meet_link' => 'https://meet.google.com/legacy-room',
            'access_token_hash' => hash('sha256', 'legacy-recording'),
        ]);
        $operation = ConsultationGoogleOperation::create([
            'consultation_booking_id' => $booking->id,
            'operation_key' => 'consultation-booking-'.$booking->id.'-google-meet_recording-legacy',
            'operation' => 'meet_recording',
            'payload' => ['meet_link' => $booking->meet_link],
            'status' => ConsultationGoogleOperation::STATUS_FAILED,
            'attempts' => 1,
            'available_at' => now('UTC')->subMinute(),
        ]);

        $this->assertSame(
            0,
            app(ConsultationGoogleOperationService::class)->retryDue(
                app(BookingWorkflowService::class),
            ),
        );
        $this->assertSame(
            ConsultationGoogleOperation::STATUS_NEEDS_ATTENTION,
            $operation->fresh()->status,
        );
    }

    public function test_meet_recording_operations_are_keyed_by_meeting_identity(): void
    {
        $tier = ConsultationTier::query()->where('slug', 'max')->firstOrFail();
        $booking = ConsultationBooking::create([
            'consultation_tier_id' => $tier->id,
            'client_name' => 'Meeting identity',
            'client_email' => 'meeting-identity@example.com',
            'starts_at' => now('UTC')->addDays(3)->setTime(10, 0),
            'ends_at' => now('UTC')->addDays(3)->setTime(11, 0),
            'status' => ConsultationBooking::STATUS_CONFIRMED,
            'list_price_cents' => $tier->price_cents,
            'amount_due_cents' => $tier->price_cents,
            'currency' => 'usd',
            'access_token_hash' => hash('sha256', 'meeting-identity'),
        ]);
        $operations = app(ConsultationGoogleOperationService::class);
        $first = $operations->queue($booking, 'meet_recording', [
            'event_id' => 'event-one',
            'meet_link' => 'https://meet.google.com/room-one',
        ]);
        $second = $operations->queue($booking, 'meet_recording', [
            'event_id' => 'event-two',
            'meet_link' => 'https://meet.google.com/room-two',
        ]);

        $this->assertNotSame($first->operation_key, $second->operation_key);
        $this->assertSame(2, $booking->googleOperations()->count());
    }

    public function test_a_meet_recording_retry_cannot_write_after_the_meeting_is_replaced(): void
    {
        $tier = ConsultationTier::query()->where('slug', 'max')->firstOrFail();
        $booking = ConsultationBooking::create([
            'consultation_tier_id' => $tier->id,
            'client_name' => 'In-flight recording operation',
            'client_email' => 'in-flight-recording@example.com',
            'starts_at' => now('UTC')->addDays(3)->setTime(10, 0),
            'ends_at' => now('UTC')->addDays(3)->setTime(11, 0),
            'status' => ConsultationBooking::STATUS_CONFIRMED,
            'list_price_cents' => $tier->price_cents,
            'amount_due_cents' => $tier->price_cents,
            'currency' => 'usd',
            'google_event_id' => 'current-event',
            'meet_link' => 'https://meet.google.com/current-room',
            'access_token_hash' => hash('sha256', 'in-flight-recording'),
        ]);
        $operation = ConsultationGoogleOperation::create([
            'consultation_booking_id' => $booking->id,
            'operation_key' => 'consultation-booking-'.$booking->id.'-google-meet_recording-in-flight',
            'operation' => 'meet_recording',
            'payload' => [
                'event_id' => 'current-event',
                'meet_link' => 'https://meet.google.com/current-room',
            ],
            'status' => ConsultationGoogleOperation::STATUS_FAILED,
            'attempts' => 1,
            'available_at' => now('UTC')->subMinute(),
        ]);

        $google = $this->createMock(GoogleCalendarService::class);
        $google->expects($this->once())
            ->method('enableMeetAutoRecording')
            ->with('https://meet.google.com/current-room', null)
            ->willReturnCallback(function () use ($booking): string {
                $booking->forceFill([
                    'google_event_id' => 'replacement-event',
                    'meet_link' => 'https://meet.google.com/replacement-room',
                ])->save();

                return 'spaces/current-room';
            });
        $this->app->instance(GoogleCalendarService::class, $google);

        $this->assertSame(
            0,
            app(ConsultationGoogleOperationService::class)->retryDue(
                app(BookingWorkflowService::class),
            ),
        );

        $fresh = $booking->fresh();
        $this->assertSame('replacement-event', $fresh->google_event_id);
        $this->assertSame('https://meet.google.com/replacement-room', $fresh->meet_link);
        $this->assertNull($fresh->google_meet_space_name);
        $this->assertSame(
            ConsultationGoogleOperation::STATUS_NEEDS_ATTENTION,
            $operation->fresh()->status,
        );
    }

    public function test_a_google_hold_failure_keeps_the_booking_and_queues_a_retry(): void
    {
        Mail::fake();

        $startsAt = now('UTC')->addDays(3)->setTime(10, 0);
        ConsultationAvailabilityWindow::create([
            'weekday' => $startsAt->dayOfWeek,
            'start_time' => '09:00:00',
            'end_time' => '12:00:00',
        ]);

        $google = $this->createMock(GoogleCalendarService::class);
        $google->expects($this->once())->method('isConnected')->willReturn(true);
        $google->expects($this->once())->method('busyPeriods')->willReturn([]);
        $google->expects($this->once())->method('createHoldEvent')->willReturn(null);
        $this->app->instance(GoogleCalendarService::class, $google);

        $tier = ConsultationTier::query()->where('slug', 'light')->firstOrFail();
        $result = $this->app->make(BookingWorkflowService::class)->requestBooking(
            $tier,
            'Hold retry client',
            'hold-retry@example.com',
            null,
            $startsAt,
        );

        $this->assertSame(ConsultationBooking::STATUS_PENDING_APPROVAL, $result['booking']->status);
        $this->assertDatabaseHas('consultation_google_operations', [
            'consultation_booking_id' => $result['booking']->id,
            'operation' => 'hold',
            'status' => ConsultationGoogleOperation::STATUS_FAILED,
        ]);
    }

    public function test_a_hold_retry_from_an_old_slot_is_not_sent_to_google(): void
    {
        $google = $this->createMock(GoogleCalendarService::class);
        $google->expects($this->never())->method('createHoldEvent');
        $this->app->instance(GoogleCalendarService::class, $google);

        $tier = ConsultationTier::query()->where('slug', 'light')->firstOrFail();
        $booking = ConsultationBooking::create([
            'consultation_tier_id' => $tier->id,
            'client_name' => 'Old hold retry',
            'client_email' => 'old-hold@example.com',
            'starts_at' => now('UTC')->addDays(3)->setTime(10, 0),
            'ends_at' => now('UTC')->addDays(3)->setTime(10, 30),
            'status' => ConsultationBooking::STATUS_PENDING_APPROVAL,
            'list_price_cents' => $tier->price_cents,
            'amount_due_cents' => $tier->price_cents,
            'currency' => 'usd',
            'google_generation' => 1,
            'hold_expires_at' => now('UTC')->addDay(),
            'access_token_hash' => hash('sha256', 'old-hold-retry'),
        ]);
        $operation = ConsultationGoogleOperation::create([
            'consultation_booking_id' => $booking->id,
            'operation_key' => 'consultation-booking-'.$booking->id.'-google-hold-g0',
            'operation' => 'hold',
            'payload' => [
                'starts_at' => $booking->starts_at->toIso8601String(),
                'ends_at' => $booking->ends_at->toIso8601String(),
                'google_generation' => 0,
            ],
            'status' => ConsultationGoogleOperation::STATUS_FAILED,
            'attempts' => 1,
            'available_at' => now('UTC')->subMinute(),
        ]);

        $this->assertSame(
            0,
            app(ConsultationGoogleOperationService::class)->retryDue(
                app(BookingWorkflowService::class),
            ),
        );
        $this->assertSame(
            ConsultationGoogleOperation::STATUS_NEEDS_ATTENTION,
            $operation->fresh()->status,
        );
    }

    public function test_a_client_pick_retry_from_an_old_generation_is_not_sent_to_google(): void
    {
        $google = $this->createMock(GoogleCalendarService::class);
        $google->expects($this->never())->method('createHoldEvent');
        $this->app->instance(GoogleCalendarService::class, $google);

        $tier = ConsultationTier::query()->where('slug', 'light')->firstOrFail();
        $startsAt = now('UTC')->addDays(4)->setTime(10, 0);
        $booking = ConsultationBooking::create([
            'consultation_tier_id' => $tier->id,
            'client_name' => 'Old client pick',
            'client_email' => 'old-client-pick@example.com',
            'starts_at' => now('UTC')->addDays(3)->setTime(10, 0),
            'ends_at' => now('UTC')->addDays(3)->setTime(10, 30),
            'status' => ConsultationBooking::STATUS_RESCHEDULE_PROPOSED,
            'list_price_cents' => $tier->price_cents,
            'amount_due_cents' => $tier->price_cents,
            'currency' => 'usd',
            'google_generation' => 1,
            'proposed_slots' => [[
                'start' => $startsAt->toIso8601String(),
                'end' => $startsAt->copy()->addMinutes(30)->toIso8601String(),
            ]],
            'hold_expires_at' => now('UTC')->addDay(),
            'access_token_hash' => hash('sha256', 'old-client-pick'),
        ]);
        $operation = ConsultationGoogleOperation::create([
            'consultation_booking_id' => $booking->id,
            'operation_key' => 'consultation-booking-'.$booking->id.'-google-client_pick-g1-old',
            'operation' => 'client_pick',
            'payload' => [
                'starts_at' => $startsAt->toIso8601String(),
                'google_generation' => 1,
            ],
            'status' => ConsultationGoogleOperation::STATUS_FAILED,
            'attempts' => 1,
            'available_at' => now('UTC')->subMinute(),
        ]);

        $this->assertSame(
            0,
            app(ConsultationGoogleOperationService::class)->retryDue(
                app(BookingWorkflowService::class),
            ),
        );
        $this->assertSame(
            ConsultationGoogleOperation::STATUS_NEEDS_ATTENTION,
            $operation->fresh()->status,
        );
        $this->assertSame(1, $booking->fresh()->google_generation);
        $this->assertSame(1, $booking->googleOperations()->count());
    }

    public function test_a_current_generation_client_pick_retry_completes_and_supersedes_older_operations(): void
    {
        Mail::fake();

        $originalStartsAt = now('UTC')->addDays(3)->setTime(10, 0);
        $newStartsAt = $originalStartsAt->copy()->addDay();
        ConsultationAvailabilityWindow::create([
            'weekday' => $newStartsAt->dayOfWeek,
            'start_time' => '09:00:00',
            'end_time' => '12:00:00',
            'is_active' => true,
        ]);

        $google = $this->createMock(GoogleCalendarService::class);
        $google->expects($this->once())->method('busyPeriods')->willReturn([]);
        $google->expects($this->once())
            ->method('createHoldEvent')
            ->willReturn('current-generation-hold');
        $google->method('isConnected')->willReturn(true);
        $this->app->instance(GoogleCalendarService::class, $google);

        $tier = ConsultationTier::query()->where('slug', 'light')->firstOrFail();
        $booking = ConsultationBooking::create([
            'consultation_tier_id' => $tier->id,
            'client_name' => 'Current generation retry',
            'client_email' => 'current-generation@example.com',
            'starts_at' => $originalStartsAt,
            'ends_at' => $originalStartsAt->copy()->addMinutes($tier->duration_minutes),
            'status' => ConsultationBooking::STATUS_RESCHEDULE_PROPOSED,
            'list_price_cents' => $tier->price_cents,
            'amount_due_cents' => $tier->price_cents,
            'currency' => 'usd',
            'confirmed_at' => now('UTC')->subDay(),
            'google_event_id' => 'original-current-generation',
            'google_generation' => 0,
            'proposed_slots' => [[
                'start' => $newStartsAt->toIso8601String(),
                'end' => $newStartsAt->copy()->addMinutes($tier->duration_minutes)->toIso8601String(),
            ]],
            'hold_expires_at' => now('UTC')->addDay(),
            'access_token_hash' => hash('sha256', 'current-generation-token'),
        ]);
        $operation = ConsultationGoogleOperation::create([
            'consultation_booking_id' => $booking->id,
            'operation_key' => 'consultation-booking-'.$booking->id.'-google-client_pick-g1-current',
            'operation' => 'client_pick',
            'payload' => [
                'starts_at' => $newStartsAt->toIso8601String(),
                'google_generation' => 1,
            ],
            'status' => ConsultationGoogleOperation::STATUS_FAILED,
            'attempts' => 1,
            'available_at' => now('UTC')->subMinute(),
        ]);

        $this->assertSame(
            1,
            app(ConsultationGoogleOperationService::class)->retryDue(
                app(BookingWorkflowService::class),
            ),
        );
        $this->assertSame(
            ConsultationGoogleOperation::STATUS_SUCCEEDED,
            $operation->fresh()->status,
        );
        $this->assertSame(1, $booking->fresh()->google_generation);
        $this->assertSame(
            ConsultationBooking::STATUS_PAID_RESCHEDULE_PENDING_APPROVAL,
            $booking->fresh()->status,
        );
    }

    public function test_a_legacy_client_pick_retry_without_a_generation_fence_needs_attention(): void
    {
        $google = $this->createMock(GoogleCalendarService::class);
        $google->expects($this->never())->method('createHoldEvent');
        $this->app->instance(GoogleCalendarService::class, $google);

        $tier = ConsultationTier::query()->where('slug', 'light')->firstOrFail();
        $startsAt = now('UTC')->addDays(4)->setTime(11, 0);
        $booking = ConsultationBooking::create([
            'consultation_tier_id' => $tier->id,
            'client_name' => 'Legacy client pick',
            'client_email' => 'legacy-client-pick@example.com',
            'starts_at' => now('UTC')->addDays(3)->setTime(10, 0),
            'ends_at' => now('UTC')->addDays(3)->setTime(10, 30),
            'status' => ConsultationBooking::STATUS_RESCHEDULE_PROPOSED,
            'list_price_cents' => $tier->price_cents,
            'amount_due_cents' => $tier->price_cents,
            'currency' => 'usd',
            'proposed_slots' => [[
                'start' => $startsAt->toIso8601String(),
                'end' => $startsAt->copy()->addMinutes(30)->toIso8601String(),
            ]],
            'hold_expires_at' => now('UTC')->addDay(),
            'access_token_hash' => hash('sha256', 'legacy-client-pick'),
        ]);
        $operation = ConsultationGoogleOperation::create([
            'consultation_booking_id' => $booking->id,
            'operation_key' => 'consultation-booking-'.$booking->id.'-google-client_pick-legacy',
            'operation' => 'client_pick',
            'payload' => ['starts_at' => $startsAt->toIso8601String()],
            'status' => ConsultationGoogleOperation::STATUS_FAILED,
            'attempts' => 1,
            'available_at' => now('UTC')->subMinute(),
        ]);

        $this->assertSame(
            0,
            app(ConsultationGoogleOperationService::class)->retryDue(
                app(BookingWorkflowService::class),
            ),
        );
        $this->assertSame(
            ConsultationGoogleOperation::STATUS_NEEDS_ATTENTION,
            $operation->fresh()->status,
        );
    }

    public function test_guest_cannot_book(): void
    {
        $this->post('/book', $this->validBookingPayload())->assertRedirect('/login');

        $this->assertDatabaseCount('consultation_bookings', 0);
    }

    public function test_unverified_user_cannot_book(): void
    {
        $this->actingAs(User::factory()->unverified()->create())
            ->post('/book', $this->validBookingPayload())
            ->assertRedirect(route('verification.notice'));

        $this->assertDatabaseCount('consultation_bookings', 0);
    }

    public function test_booking_requires_company_website_and_needs(): void
    {
        $this->actingAs(User::factory()->create())
            ->post('/book', array_merge($this->validBookingPayload(), [
                'company_name' => '',
                'website' => '',
                'notes' => '',
            ]))
            ->assertSessionHasErrors(['company_name', 'website', 'notes']);

        $this->actingAs(User::factory()->create())
            ->post('/book', array_merge($this->validBookingPayload(), ['website' => 'not a url']))
            ->assertSessionHasErrors('website');

        $this->assertDatabaseCount('consultation_bookings', 0);
    }

    public function test_booking_uses_account_email_and_stores_details(): void
    {
        Mail::fake();
        $user = User::factory()->create(['email' => 'client@example.com']);

        $this->actingAs($user)
            ->post('/book', array_merge($this->validBookingPayload($user), [
                'client_email' => 'x@evil.test',
                'role' => 'CTO',
                'team_size' => '11-50',
                'budget' => '$5k-$20k',
            ]))
            ->assertSessionHasNoErrors()
            ->assertRedirect();

        $booking = ConsultationBooking::query()->firstOrFail();
        $this->assertSame('client@example.com', $booking->client_email);
        $this->assertSame($user->id, $booking->user_id);
        $this->assertSame('Acme', $booking->company_name);
        $this->assertSame('https://acme.test', $booking->website);
        $this->assertSame('Kubernetes help', $booking->notes);
        $this->assertSame('CTO', $booking->role);
        $this->assertSame('11-50', $booking->team_size);
        $this->assertSame('$5k-$20k', $booking->budget);
        $this->assertSame('https://acme.test', $booking->toAdminArray()['website']);
    }

    public function test_booking_website_without_scheme_gets_https(): void
    {
        Mail::fake();
        $user = User::factory()->create();

        $this->actingAs($user)
            ->post('/book', array_merge($this->validBookingPayload($user), ['website' => 'acme.com']))
            ->assertSessionHasNoErrors();

        $this->assertSame('https://acme.com', ConsultationBooking::query()->firstOrFail()->website);
    }

    private function validBookingPayload(?User $user = null): array
    {
        return [
            'credit_id' => $user ? $this->sponsorCredit($user)->id : 1,
            'client_name' => 'Client Person',
            'company_name' => 'Acme',
            'website' => 'https://acme.test',
            'notes' => 'Kubernetes help',
            'starts_at' => $this->nextWeekdayAt(10)->toIso8601String(),
        ];
    }

    private function nextWeekdayAt(int $hour): Carbon
    {
        $startsAt = now('UTC')->addDays(3)->setTime($hour, 0);

        while ($startsAt->isWeekend()) {
            $startsAt->addDay();
        }

        return $startsAt;
    }
}
