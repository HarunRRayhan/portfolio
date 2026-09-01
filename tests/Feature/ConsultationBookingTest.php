<?php

namespace Tests\Feature;

use App\Mail\Consultation\BookingCancellationDeniedMail;
use App\Mail\Consultation\BookingConfirmedMail;
use App\Mail\Consultation\BookingRescheduleDeniedMail;
use App\Models\ConsultationAvailabilityWindow;
use App\Models\ConsultationBooking;
use App\Models\ConsultationCoupon;
use App\Models\ConsultationGoogleOperation;
use App\Models\ConsultationSetting;
use App\Models\ConsultationStripeCheckoutAttempt;
use App\Models\ConsultationTier;
use App\Services\Consultation\BookingWorkflowService;
use App\Services\Consultation\ConsultationGoogleOperationService;
use App\Services\Consultation\ConsultationNotificationService;
use App\Services\Consultation\GoogleCalendarService;
use App\Services\Consultation\StripeCheckoutService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class ConsultationBookingTest extends TestCase
{
    use RefreshDatabase;

    public function test_first_thousand_booking_requests_receive_the_launch_discount(): void
    {
        Mail::fake();

        $tier = ConsultationTier::query()->where('slug', 'light')->firstOrFail();
        $result = $this->app->make(BookingWorkflowService::class)->requestBooking(
            $tier,
            'Launch customer',
            'launch@example.com',
            null,
            $this->nextWeekdayAt(10),
        );

        $booking = $result['booking']->fresh();

        $this->assertSame(24900, $booking->list_price_cents);
        $this->assertSame(10000, $booking->campaign_discount_cents);
        $this->assertSame(0, $booking->discount_percent);
        $this->assertSame(14900, $booking->amount_due_cents);
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
        $this->assertSame(11920, $booking->amount_due_cents);
        $this->assertSame('1', ConsultationSetting::query()
            ->where('key', 'consultation_booking_promotion_claimed_count')
            ->value('value'));
    }

    public function test_only_the_first_hundred_requests_claim_the_launch_discount(): void
    {
        Mail::fake();
        ConsultationSetting::setValue('consultation_booking_promotion_claimed_count', '99');

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
        $this->assertSame(14900, $first->amount_due_cents);
        $this->assertSame(24900, $second->amount_due_cents);
        $this->assertSame('100', ConsultationSetting::query()
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
        $this->assertSame(24900, $booking->amount_due_cents);
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

    public function test_payment_confirmation_keeps_the_payment_access_token_valid(): void
    {
        Mail::fake();

        $google = $this->createMock(GoogleCalendarService::class);
        $google->expects($this->once())->method('deleteEvent')->with('hold-event');
        $google->expects($this->once())->method('createConfirmedEvent')->willReturn([
            'event_id' => 'confirmed-event',
            'meet_link' => 'https://meet.google.com/test-room',
            'conference_id' => 'test-room',
        ]);
        $this->app->instance(GoogleCalendarService::class, $google);

        $stripe = $this->createMock(StripeCheckoutService::class);
        $this->app->instance(StripeCheckoutService::class, $stripe);

        $tier = ConsultationTier::query()->where('slug', 'light')->firstOrFail();
        $token = 'payment-access-token';
        $booking = ConsultationBooking::create([
            'consultation_tier_id' => $tier->id,
            'client_name' => 'Ada Lovelace',
            'client_email' => 'ada@example.com',
            'starts_at' => now('UTC')->addDays(3)->setTime(10, 0),
            'ends_at' => now('UTC')->addDays(3)->setTime(10, 30),
            'status' => ConsultationBooking::STATUS_AWAITING_PAYMENT,
            'list_price_cents' => $tier->price_cents,
            'amount_due_cents' => $tier->price_cents,
            'currency' => 'usd',
            'google_event_id' => 'hold-event',
            'payment_due_at' => now('UTC')->addDays(2),
            'access_token_hash' => hash('sha256', $token),
        ]);

        $workflow = $this->app->make(BookingWorkflowService::class);
        $workflow->markPaidFromStripe($booking, 'cs_test', 'pi_test');
        $workflow->markPaidFromStripe($booking, 'cs_test', 'pi_test');

        $this->assertDatabaseHas('consultation_bookings', [
            'id' => $booking->id,
            'status' => ConsultationBooking::STATUS_CONFIRMED,
            'stripe_checkout_session_id' => 'cs_test',
            'stripe_payment_intent_id' => 'pi_test',
            'access_token_hash' => hash('sha256', $token),
        ]);

        $this->get('/book/b/'.$booking->public_id.'?token='.$token)
            ->assertRedirect('/book/b/'.$booking->public_id);
        $this->get('/book/b/'.$booking->public_id)->assertOk();
        Mail::assertSent(BookingConfirmedMail::class);
    }

    public function test_a_paid_reschedule_does_not_start_a_second_checkout_or_redeem_coupon_again(): void
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
        $google->expects($this->once())->method('deleteEvent')->with('old-event');
        $google->expects($this->once())->method('createConfirmedEvent')->willReturn([
            'event_id' => 'new-event',
            'meet_link' => 'https://meet.google.com/new-room',
            'conference_id' => 'new-room',
        ]);
        $this->app->instance(GoogleCalendarService::class, $google);

        $stripe = $this->createMock(StripeCheckoutService::class);
        $stripe->expects($this->never())->method('configured');
        $this->app->instance(StripeCheckoutService::class, $stripe);

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
            'stripe_payment_intent_id' => 'pi_original',
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
            'stripe_payment_intent_id' => 'pi_original',
        ]);
        $this->assertSame(1, $coupon->fresh()->redeemed_count);
    }

    public function test_paid_approval_is_not_marked_awaiting_payment_when_stripe_is_unconfigured(): void
    {
        $startsAt = now('UTC')->addDays(3)->setTime(10, 0);
        ConsultationAvailabilityWindow::create([
            'weekday' => $startsAt->dayOfWeek,
            'start_time' => '09:00:00',
            'end_time' => '12:00:00',
            'is_active' => true,
        ]);

        $google = $this->createMock(GoogleCalendarService::class);
        $google->method('busyPeriods')->willReturn([]);
        $this->app->instance(GoogleCalendarService::class, $google);

        $stripe = $this->createMock(StripeCheckoutService::class);
        $stripe->expects($this->once())->method('configured')->willReturn(false);
        $this->app->instance(StripeCheckoutService::class, $stripe);

        $tier = ConsultationTier::query()->where('slug', 'light')->firstOrFail();
        $booking = ConsultationBooking::create([
            'consultation_tier_id' => $tier->id,
            'client_name' => 'Ada Lovelace',
            'client_email' => 'ada@example.com',
            'starts_at' => $startsAt,
            'ends_at' => $startsAt->copy()->addMinutes($tier->duration_minutes),
            'status' => ConsultationBooking::STATUS_PENDING_APPROVAL,
            'list_price_cents' => $tier->price_cents,
            'amount_due_cents' => $tier->price_cents,
            'currency' => 'usd',
            'hold_expires_at' => now('UTC')->addHours(48),
            'payment_due_at' => $startsAt->copy()->subDay(),
            'access_token_hash' => hash('sha256', 'pending-token'),
        ]);

        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('Stripe payments are not configured yet.');

        try {
            $this->app->make(BookingWorkflowService::class)->approve($booking);
        } finally {
            $this->assertSame(
                ConsultationBooking::STATUS_PENDING_APPROVAL,
                $booking->fresh()->status,
            );
        }
    }

    public function test_stripe_checkout_failure_leaves_an_approved_booking_retryable(): void
    {
        $startsAt = now('UTC')->addDays(3)->setTime(10, 0);
        ConsultationAvailabilityWindow::create([
            'weekday' => $startsAt->dayOfWeek,
            'start_time' => '09:00:00',
            'end_time' => '12:00:00',
            'is_active' => true,
        ]);

        $google = $this->createStub(GoogleCalendarService::class);
        $google->method('busyPeriods')->willReturn([]);
        $google->method('isConnected')->willReturn(false);
        $this->app->instance(GoogleCalendarService::class, $google);

        $stripe = $this->createMock(StripeCheckoutService::class);
        $stripe->expects($this->once())->method('configured')->willReturn(true);
        $stripe->expects($this->once())
            ->method('createCheckoutUrl')
            ->willThrowException(new \RuntimeException('Stripe is unavailable'));
        $this->app->instance(StripeCheckoutService::class, $stripe);

        $tier = ConsultationTier::query()->where('slug', 'light')->firstOrFail();
        $booking = ConsultationBooking::create([
            'consultation_tier_id' => $tier->id,
            'client_name' => 'Retry approval',
            'client_email' => 'retry-approval@example.com',
            'starts_at' => $startsAt,
            'ends_at' => $startsAt->copy()->addMinutes($tier->duration_minutes),
            'status' => ConsultationBooking::STATUS_PENDING_APPROVAL,
            'list_price_cents' => $tier->price_cents,
            'amount_due_cents' => $tier->price_cents,
            'currency' => 'usd',
            'hold_expires_at' => now('UTC')->addHours(48),
            'payment_due_at' => $startsAt->copy()->subDay(),
            'access_token_hash' => hash('sha256', 'retry-approval'),
        ]);

        $this->expectException(\RuntimeException::class);

        try {
            $this->app->make(BookingWorkflowService::class)->approve($booking);
        } finally {
            $this->assertSame(
                ConsultationBooking::STATUS_AWAITING_PAYMENT,
                $booking->fresh()->status,
            );
            $this->assertDatabaseHas('consultation_booking_events', [
                'consultation_booking_id' => $booking->id,
                'event' => 'approved_awaiting_payment',
            ]);
        }
    }

    public function test_approval_uses_the_existing_checkout_attempt_token_when_checkout_wins_a_race(): void
    {
        Mail::fake();

        $startsAt = now('UTC')->addDays(3)->setTime(10, 0);
        ConsultationAvailabilityWindow::create([
            'weekday' => $startsAt->dayOfWeek,
            'start_time' => '09:00:00',
            'end_time' => '12:00:00',
            'is_active' => true,
        ]);

        $google = $this->createStub(GoogleCalendarService::class);
        $google->method('busyPeriods')->willReturn([]);
        $google->method('isConnected')->willReturn(false);
        $this->app->instance(GoogleCalendarService::class, $google);

        $stripe = $this->createMock(StripeCheckoutService::class);
        $stripe->expects($this->once())->method('configured')->willReturn(true);
        $stripe->expects($this->once())
            ->method('createCheckoutUrl')
            ->willReturnCallback(function (ConsultationBooking $checkoutBooking): string {
                $checkoutBooking->forceFill([
                    'stripe_checkout_session_id' => 'cs_race',
                    'stripe_checkout_idempotency_key' => 'consultation-checkout-race',
                ])->save();
                ConsultationStripeCheckoutAttempt::create([
                    'consultation_booking_id' => $checkoutBooking->id,
                    'idempotency_key' => 'consultation-checkout-race',
                    'access_token' => 'existing-checkout-token',
                    'stripe_checkout_session_id' => 'cs_race',
                    'status' => ConsultationStripeCheckoutAttempt::STATUS_CREATED,
                    'attempts' => 1,
                    'completed_at' => now('UTC'),
                ]);

                return 'https://checkout.stripe.test/cs_race';
            });
        $this->app->instance(StripeCheckoutService::class, $stripe);

        $tier = ConsultationTier::query()->where('slug', 'light')->firstOrFail();
        $booking = ConsultationBooking::create([
            'consultation_tier_id' => $tier->id,
            'client_name' => 'Approval race',
            'client_email' => 'approval-race@example.com',
            'starts_at' => $startsAt,
            'ends_at' => $startsAt->copy()->addMinutes($tier->duration_minutes),
            'status' => ConsultationBooking::STATUS_PENDING_APPROVAL,
            'list_price_cents' => $tier->price_cents,
            'amount_due_cents' => $tier->price_cents,
            'currency' => 'usd',
            'hold_expires_at' => now('UTC')->addHours(48),
            'payment_due_at' => $startsAt->copy()->subDay(),
            'access_token_hash' => hash('sha256', 'original-approval-token'),
        ]);

        $this->app->make(BookingWorkflowService::class)->approve($booking);

        $this->assertSame(
            hash('sha256', 'existing-checkout-token'),
            $booking->fresh()->access_token_hash,
        );
    }

    public function test_late_stripe_payment_does_not_confirm_the_booking(): void
    {
        $tier = ConsultationTier::query()->where('slug', 'light')->firstOrFail();
        $booking = ConsultationBooking::create([
            'consultation_tier_id' => $tier->id,
            'client_name' => 'Late payment',
            'client_email' => 'late@example.com',
            'starts_at' => now('UTC')->addDays(3)->setTime(10, 0),
            'ends_at' => now('UTC')->addDays(3)->setTime(10, 30),
            'status' => ConsultationBooking::STATUS_AWAITING_PAYMENT,
            'list_price_cents' => $tier->price_cents,
            'amount_due_cents' => $tier->price_cents,
            'currency' => 'usd',
            'payment_due_at' => now('UTC')->subMinute(),
            'access_token_hash' => hash('sha256', 'late-payment'),
        ]);

        $this->expectException(
            \InvalidArgumentException::class,
        );
        $this->expectExceptionMessage('payment deadline');

        try {
            $this->app->make(BookingWorkflowService::class)->markPaidFromStripe($booking, 'cs_late', 'pi_late');
        } finally {
            $this->assertSame(
                ConsultationBooking::STATUS_AWAITING_PAYMENT,
                $booking->fresh()->status,
            );
        }
    }

    public function test_a_refunded_rejected_payment_clears_paid_state_and_rotates_checkout(): void
    {
        $tier = ConsultationTier::query()->where('slug', 'light')->firstOrFail();
        $booking = ConsultationBooking::create([
            'consultation_tier_id' => $tier->id,
            'client_name' => 'Rejected payment',
            'client_email' => 'rejected-payment@example.com',
            'starts_at' => now('UTC')->addDays(3)->setTime(10, 0),
            'ends_at' => now('UTC')->addDays(3)->setTime(10, 30),
            'status' => ConsultationBooking::STATUS_AWAITING_PAYMENT,
            'list_price_cents' => $tier->price_cents,
            'amount_due_cents' => $tier->price_cents,
            'currency' => 'usd',
            'stripe_checkout_session_id' => 'cs_rejected',
            'stripe_payment_intent_id' => 'pi_rejected',
            'stripe_paid_at' => now('UTC'),
            'payment_due_at' => now('UTC')->addDay(),
            'access_token_hash' => hash('sha256', 'rejected-token'),
        ]);
        $booking->forceFill([
            'stripe_checkout_idempotency_key' => 'consultation-checkout-'.$booking->id,
        ])->save();

        $workflow = $this->app->make(BookingWorkflowService::class);
        $this->assertTrue($workflow->resetRejectedStripePayment(
            $booking,
            'cs_rejected',
            'pi_rejected',
            'coupon was no longer available',
        ));

        $fresh = $booking->fresh();
        $this->assertSame(ConsultationBooking::STATUS_AWAITING_PAYMENT, $fresh->status);
        $this->assertNull($fresh->stripe_checkout_session_id);
        $this->assertNull($fresh->stripe_payment_intent_id);
        $this->assertNull($fresh->stripe_paid_at);
        $this->assertSame('cs_rejected', $fresh->stripe_checkout_rejected_session_id);
        $this->assertNotSame('consultation-checkout-'.$booking->id, $fresh->stripe_checkout_idempotency_key);

        try {
            $workflow->markPaidFromStripe($fresh, 'cs_rejected', 'pi_rejected');
            $this->fail('A rejected Stripe session must not be accepted later.');
        } catch (\InvalidArgumentException $e) {
            $this->assertSame('Stripe checkout session was already rejected.', $e->getMessage());
        }
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
            'amount_due_cents' => $coupon->discountedAmountCents($tier->price_cents),
            'currency' => 'usd',
            'stripe_paid_at' => now('UTC'),
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

    public function test_connected_google_failure_does_not_confirm_a_paid_booking(): void
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
            'status' => ConsultationBooking::STATUS_AWAITING_PAYMENT,
            'list_price_cents' => $tier->price_cents,
            'amount_due_cents' => $tier->price_cents,
            'currency' => 'usd',
            'payment_due_at' => now('UTC')->addDays(2),
            'access_token_hash' => hash('sha256', 'calendar-failure'),
        ]);

        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('Google Calendar');

        try {
            $this->app->make(BookingWorkflowService::class)->markPaidFromStripe($booking, 'cs_calendar', 'pi_calendar');
        } finally {
            $fresh = $booking->fresh();
            $this->assertSame(ConsultationBooking::STATUS_AWAITING_PAYMENT, $fresh->status);
            $this->assertNotNull($fresh->stripe_paid_at);
            $this->assertSame(0, $this->app->make(BookingWorkflowService::class)->expireUnpaidPastDeadline());
        }
    }

    public function test_approved_cancellation_refunds_the_payment_before_cancelling(): void
    {
        Mail::fake();

        $google = $this->createMock(GoogleCalendarService::class);
        $google->expects($this->once())->method('deleteEvent')->with('confirmed-event')->willReturn(true);
        $google->method('isConnected')->willReturn(false);
        $this->app->instance(GoogleCalendarService::class, $google);

        $stripe = $this->createMock(StripeCheckoutService::class);
        $stripe->expects($this->once())->method('refundBooking')->willReturn('re_test');
        $this->app->instance(StripeCheckoutService::class, $stripe);

        $tier = ConsultationTier::query()->where('slug', 'light')->firstOrFail();
        $booking = ConsultationBooking::create([
            'consultation_tier_id' => $tier->id,
            'client_name' => 'Cancellation',
            'client_email' => 'cancel@example.com',
            'starts_at' => now('UTC')->addDays(3)->setTime(10, 0),
            'ends_at' => now('UTC')->addDays(3)->setTime(10, 30),
            'status' => ConsultationBooking::STATUS_CANCEL_REQUESTED,
            'list_price_cents' => $tier->price_cents,
            'amount_due_cents' => $tier->price_cents,
            'currency' => 'usd',
            'stripe_payment_intent_id' => 'pi_cancel',
            'google_event_id' => 'confirmed-event',
            'access_token_hash' => hash('sha256', 'cancel'),
        ]);

        $result = $this->app->make(BookingWorkflowService::class)->approveCancel($booking);

        $this->assertSame(ConsultationBooking::STATUS_CANCELLED, $result->status);
        $this->assertDatabaseHas('consultation_bookings', [
            'id' => $booking->id,
            'status' => ConsultationBooking::STATUS_CANCELLED,
        ]);
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

    public function test_paid_reschedule_decline_restores_the_original_appointment_without_refunding(): void
    {
        Mail::fake();

        $google = $this->createMock(GoogleCalendarService::class);
        $google->expects($this->once())->method('deleteEvent')->with('reschedule-hold')->willReturn(true);
        $google->method('isConnected')->willReturn(true);
        $this->app->instance(GoogleCalendarService::class, $google);
        $this->app->instance(StripeCheckoutService::class, $this->createStub(StripeCheckoutService::class));

        $tier = ConsultationTier::query()->where('slug', 'light')->firstOrFail();
        $originalStartsAt = now('UTC')->addDays(3)->setTime(10, 0);
        $newStartsAt = $originalStartsAt->copy()->addDay();
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
            'stripe_checkout_session_id' => 'cs_paid',
            'stripe_payment_intent_id' => 'pi_paid',
            'confirmed_at' => now('UTC')->subDay(),
            'google_event_id' => 'original-event',
            'reschedule_hold_event_id' => 'reschedule-hold',
            'reschedule_original_starts_at' => $originalStartsAt,
            'reschedule_original_ends_at' => $originalStartsAt->copy()->addMinutes($tier->duration_minutes),
            'hold_expires_at' => now('UTC')->addDay(),
            'access_token_hash' => hash('sha256', 'paid-reschedule-decline'),
        ]);

        $result = $this->app->make(BookingWorkflowService::class)->decline($booking);

        $this->assertSame(ConsultationBooking::STATUS_CONFIRMED, $result->status);
        $this->assertTrue($result->starts_at->equalTo($originalStartsAt));
        $this->assertSame('original-event', $result->google_event_id);
        $this->assertNull($result->reschedule_hold_event_id);
        $this->assertSame('pi_paid', $result->stripe_payment_intent_id);
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
        $this->app->instance(StripeCheckoutService::class, $this->createStub(StripeCheckoutService::class));

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
            'stripe_payment_intent_id' => 'pi_paid_approval',
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
        $this->app->instance(StripeCheckoutService::class, $this->createStub(StripeCheckoutService::class));

        $tier = ConsultationTier::query()->where('slug', 'light')->firstOrFail();
        $originalStartsAt = now('UTC')->addDays(3)->setTime(10, 0);
        $newStartsAt = $originalStartsAt->copy()->addDay();
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
            'stripe_payment_intent_id' => 'pi_paid_expiry',
            'confirmed_at' => now('UTC')->subDay(),
            'google_event_id' => 'original-expiry-event',
            'reschedule_hold_event_id' => 'expired-reschedule-hold',
            'reschedule_original_starts_at' => $originalStartsAt,
            'reschedule_original_ends_at' => $originalStartsAt->copy()->addMinutes($tier->duration_minutes),
            'hold_expires_at' => now('UTC')->subMinute(),
            'access_token_hash' => hash('sha256', 'paid-reschedule-expiry'),
        ]);

        $this->assertSame(1, $this->app->make(BookingWorkflowService::class)->expireStaleHolds());

        $result = $booking->fresh();
        $this->assertSame(ConsultationBooking::STATUS_CONFIRMED, $result->status);
        $this->assertTrue($result->starts_at->equalTo($originalStartsAt));
        $this->assertSame('original-expiry-event', $result->google_event_id);
        Mail::assertSent(BookingRescheduleDeniedMail::class);
    }

    public function test_paid_reschedule_pick_preserves_the_original_calendar_event_until_approval(): void
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
            'stripe_payment_intent_id' => 'pi_paid_pick',
            'confirmed_at' => now('UTC')->subDay(),
            'google_event_id' => 'original-pick-event',
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

    public function test_cancellation_cannot_be_denied_after_a_refund_attempt_starts(): void
    {
        Mail::fake();

        $google = $this->createMock(GoogleCalendarService::class);
        $google->expects($this->once())->method('deleteEvent')->with('cancel-event')->willReturn(false);
        $google->method('isConnected')->willReturn(true);
        $this->app->instance(GoogleCalendarService::class, $google);

        $stripe = $this->createMock(StripeCheckoutService::class);
        $stripe->expects($this->once())->method('refundBooking')->willReturn('re_cancel');
        $this->app->instance(StripeCheckoutService::class, $stripe);

        $tier = ConsultationTier::query()->where('slug', 'light')->firstOrFail();
        $booking = ConsultationBooking::create([
            'consultation_tier_id' => $tier->id,
            'client_name' => 'Refund saga',
            'client_email' => 'refund-saga@example.com',
            'starts_at' => now('UTC')->addDays(3)->setTime(10, 0),
            'ends_at' => now('UTC')->addDays(3)->setTime(10, 30),
            'status' => ConsultationBooking::STATUS_CANCEL_REQUESTED,
            'list_price_cents' => $tier->price_cents,
            'amount_due_cents' => $tier->price_cents,
            'currency' => 'usd',
            'stripe_payment_intent_id' => 'pi_cancel_saga',
            'google_event_id' => 'cancel-event',
            'access_token_hash' => hash('sha256', 'refund-saga'),
        ]);

        $this->expectException(\RuntimeException::class);

        try {
            $this->app->make(BookingWorkflowService::class)->approveCancel($booking);
        } finally {
            $fresh = $booking->fresh();
            $this->assertSame(ConsultationBooking::STATUS_CANCEL_REQUESTED, $fresh->status);
            $this->assertSame('re_cancel', $fresh->stripe_refund_id);
            $this->assertNotNull($fresh->stripe_refund_attempted_at);

            try {
                $this->app->make(BookingWorkflowService::class)->denyCancel($fresh);
                $this->fail('A cancellation with a refund attempt should not be deniable.');
            } catch (\InvalidArgumentException $e) {
                $this->assertStringContainsString('refund has started', $e->getMessage());
            }
        }
    }

    public function test_a_failed_cancellation_refund_is_retried_without_auto_approving_new_requests(): void
    {
        Mail::fake();

        $google = $this->createMock(GoogleCalendarService::class);
        $google->expects($this->once())->method('deleteEvent')->with('retry-cancel-event')->willReturn(true);
        $google->method('isConnected')->willReturn(false);
        $this->app->instance(GoogleCalendarService::class, $google);

        $refundCalls = 0;
        $stripe = $this->createMock(StripeCheckoutService::class);
        $stripe->expects($this->exactly(2))
            ->method('refundBooking')
            ->willReturnCallback(function () use (&$refundCalls): string {
                $refundCalls++;
                if ($refundCalls === 1) {
                    throw new \RuntimeException('Stripe is temporarily unavailable.');
                }

                return 're_retry';
            });
        $this->app->instance(StripeCheckoutService::class, $stripe);

        $tier = ConsultationTier::query()->where('slug', 'light')->firstOrFail();
        $booking = ConsultationBooking::create([
            'consultation_tier_id' => $tier->id,
            'client_name' => 'Refund retry',
            'client_email' => 'refund-retry@example.com',
            'starts_at' => now('UTC')->addDays(3)->setTime(10, 0),
            'ends_at' => now('UTC')->addDays(3)->setTime(10, 30),
            'status' => ConsultationBooking::STATUS_CANCEL_REQUESTED,
            'list_price_cents' => $tier->price_cents,
            'amount_due_cents' => $tier->price_cents,
            'currency' => 'usd',
            'stripe_payment_intent_id' => 'pi_retry',
            'google_event_id' => 'retry-cancel-event',
            'access_token_hash' => hash('sha256', 'refund-retry'),
        ]);

        try {
            $this->app->make(BookingWorkflowService::class)->approveCancel($booking);
            $this->fail('The first refund attempt should fail.');
        } catch (\RuntimeException $e) {
            $this->assertSame('Stripe is temporarily unavailable.', $e->getMessage());
        }

        $failed = $booking->fresh();
        $this->assertSame(ConsultationBooking::STATUS_CANCEL_REQUESTED, $failed->status);
        $this->assertSame('Stripe is temporarily unavailable.', $failed->stripe_refund_last_error);

        $this->assertSame(1, $this->app->make(BookingWorkflowService::class)->retryPendingRefunds());
        $this->assertSame(ConsultationBooking::STATUS_CANCELLED, $booking->fresh()->status);
        $this->assertNull($booking->fresh()->stripe_refund_last_error);

        $unapproved = ConsultationBooking::create([
            'consultation_tier_id' => $tier->id,
            'client_name' => 'Still pending cancellation',
            'client_email' => 'still-pending@example.com',
            'starts_at' => now('UTC')->addDays(4)->setTime(10, 0),
            'ends_at' => now('UTC')->addDays(4)->setTime(10, 30),
            'status' => ConsultationBooking::STATUS_CANCEL_REQUESTED,
            'list_price_cents' => $tier->price_cents,
            'amount_due_cents' => $tier->price_cents,
            'currency' => 'usd',
            'stripe_payment_intent_id' => 'pi_unapproved',
            'access_token_hash' => hash('sha256', 'still-pending'),
        ]);

        $this->assertSame(0, $this->app->make(BookingWorkflowService::class)->retryPendingRefunds());
        $this->assertSame(ConsultationBooking::STATUS_CANCEL_REQUESTED, $unapproved->fresh()->status);
    }

    public function test_refund_recovery_backfill_marks_only_legacy_approved_cancellations(): void
    {
        $tier = ConsultationTier::query()->where('slug', 'light')->firstOrFail();
        $approved = ConsultationBooking::create([
            'consultation_tier_id' => $tier->id,
            'client_name' => 'Legacy approved cancellation',
            'client_email' => 'legacy-approved@example.com',
            'starts_at' => now('UTC')->addDays(3)->setTime(10, 0),
            'ends_at' => now('UTC')->addDays(3)->setTime(10, 30),
            'status' => ConsultationBooking::STATUS_CANCEL_REQUESTED,
            'list_price_cents' => $tier->price_cents,
            'amount_due_cents' => $tier->price_cents,
            'currency' => 'usd',
            'stripe_payment_intent_id' => 'pi_legacy_approved',
            'access_token_hash' => hash('sha256', 'legacy-approved'),
        ]);
        $approved->recordEvent('cancel_approved', 'admin');

        $pending = ConsultationBooking::create([
            'consultation_tier_id' => $tier->id,
            'client_name' => 'Legacy pending cancellation',
            'client_email' => 'legacy-pending@example.com',
            'starts_at' => now('UTC')->addDays(4)->setTime(10, 0),
            'ends_at' => now('UTC')->addDays(4)->setTime(10, 30),
            'status' => ConsultationBooking::STATUS_CANCEL_REQUESTED,
            'list_price_cents' => $tier->price_cents,
            'amount_due_cents' => $tier->price_cents,
            'currency' => 'usd',
            'stripe_payment_intent_id' => 'pi_legacy_pending',
            'access_token_hash' => hash('sha256', 'legacy-pending'),
        ]);

        $cancelled = ConsultationBooking::create([
            'consultation_tier_id' => $tier->id,
            'client_name' => 'Legacy completed cancellation',
            'client_email' => 'legacy-completed@example.com',
            'starts_at' => now('UTC')->addDays(5)->setTime(10, 0),
            'ends_at' => now('UTC')->addDays(5)->setTime(10, 30),
            'status' => ConsultationBooking::STATUS_CANCELLED,
            'list_price_cents' => $tier->price_cents,
            'amount_due_cents' => $tier->price_cents,
            'currency' => 'usd',
            'stripe_payment_intent_id' => 'pi_legacy_completed',
            'cancelled_at' => now('UTC')->subHour(),
            'access_token_hash' => hash('sha256', 'legacy-completed'),
        ]);
        $cancelled->recordEvent('cancel_approved', 'admin');

        $migration = require base_path('database/migrations/2026_09_01_100800_backfill_consultation_refund_recovery.php');
        $migration->up();

        $freshApproved = $approved->fresh();
        $this->assertNotNull($freshApproved->stripe_refund_attempted_at);
        $this->assertSame(
            'consultation-booking-'.$approved->id.'-refund',
            $freshApproved->stripe_refund_idempotency_key,
        );
        $this->assertNull($pending->fresh()->stripe_refund_attempted_at);
        $this->assertNotNull($cancelled->fresh()->stripe_refund_attempted_at);
    }

    public function test_a_legacy_cancelled_booking_refund_is_retried_without_reopening_cancellation(): void
    {
        $stripe = $this->createMock(StripeCheckoutService::class);
        $stripe->expects($this->once())->method('refundBooking')->willReturn('re_legacy');
        $this->app->instance(StripeCheckoutService::class, $stripe);

        $tier = ConsultationTier::query()->where('slug', 'light')->firstOrFail();
        $booking = ConsultationBooking::create([
            'consultation_tier_id' => $tier->id,
            'client_name' => 'Legacy refund retry',
            'client_email' => 'legacy-refund-retry@example.com',
            'starts_at' => now('UTC')->addDays(3)->setTime(10, 0),
            'ends_at' => now('UTC')->addDays(3)->setTime(10, 30),
            'status' => ConsultationBooking::STATUS_CANCELLED,
            'list_price_cents' => $tier->price_cents,
            'amount_due_cents' => $tier->price_cents,
            'currency' => 'usd',
            'stripe_payment_intent_id' => 'pi_legacy_retry',
            'stripe_refund_attempted_at' => now('UTC')->subMinute(),
            'stripe_refund_idempotency_key' => 'consultation-booking-legacy-refund',
            'cancelled_at' => now('UTC')->subHour(),
            'access_token_hash' => hash('sha256', 'legacy-refund-retry'),
        ]);

        $this->assertSame(1, $this->app->make(BookingWorkflowService::class)->retryPendingRefunds());
        $fresh = $booking->fresh();
        $this->assertSame(ConsultationBooking::STATUS_CANCELLED, $fresh->status);
        $this->assertSame('re_legacy', $fresh->stripe_refund_id);
    }

    public function test_a_refund_timestamp_without_an_id_is_left_for_manual_audit(): void
    {
        $stripe = $this->createMock(StripeCheckoutService::class);
        $stripe->expects($this->never())->method('refundBooking');
        $this->app->instance(StripeCheckoutService::class, $stripe);

        $tier = ConsultationTier::query()->where('slug', 'light')->firstOrFail();
        $booking = ConsultationBooking::create([
            'consultation_tier_id' => $tier->id,
            'client_name' => 'Manual refund audit',
            'client_email' => 'manual-refund-audit@example.com',
            'starts_at' => now('UTC')->addDays(3)->setTime(10, 0),
            'ends_at' => now('UTC')->addDays(3)->setTime(10, 30),
            'status' => ConsultationBooking::STATUS_CANCELLED,
            'list_price_cents' => $tier->price_cents,
            'amount_due_cents' => $tier->price_cents,
            'currency' => 'usd',
            'stripe_payment_intent_id' => 'pi_manual_audit',
            'stripe_refunded_at' => now('UTC')->subHour(),
            'cancelled_at' => now('UTC')->subHour(),
            'access_token_hash' => hash('sha256', 'manual-refund-audit'),
        ]);

        $this->assertSame(0, $this->app->make(BookingWorkflowService::class)->retryPendingRefunds());
        $this->assertNull($booking->fresh()->stripe_refund_id);
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
            'stripe_payment_intent_id' => 'pi_current_generation',
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

    private function nextWeekdayAt(int $hour): Carbon
    {
        $startsAt = now('UTC')->addDays(3)->setTime($hour, 0);

        while ($startsAt->isWeekend()) {
            $startsAt->addDay();
        }

        return $startsAt;
    }
}
