<?php

namespace App\Services\Consultation;

use App\Mail\Consultation\BookingAwaitingPaymentMail;
use App\Mail\Consultation\BookingCancellationDeniedMail;
use App\Mail\Consultation\BookingCancelledMail;
use App\Mail\Consultation\BookingConfirmedMail;
use App\Mail\Consultation\BookingDeclinedMail;
use App\Mail\Consultation\BookingExpiredMail;
use App\Mail\Consultation\BookingPendingAdminMail;
use App\Mail\Consultation\BookingPendingClientMail;
use App\Mail\Consultation\BookingRescheduleDeniedMail;
use App\Mail\Consultation\BookingRescheduleProposedMail;
use App\Models\ConsultationBooking;
use App\Models\ConsultationCoupon;
use App\Models\ConsultationSetting;
use App\Models\ConsultationTier;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class BookingWorkflowService
{
    public function __construct(
        protected AvailabilityService $availability,
        protected GoogleCalendarService $google,
        protected StripeCheckoutService $stripe,
    ) {}

    /**
     * @return array{booking: ConsultationBooking, plain_token: string}
     */
    public function requestBooking(
        ConsultationTier $tier,
        string $name,
        string $email,
        ?string $notes,
        Carbon $startsAt,
        ?ConsultationCoupon $coupon = null,
    ): array {
        $startsAt = $startsAt->copy()->utc();
        $plainToken = Str::random(48);

        $booking = DB::transaction(function () use ($tier, $name, $email, $notes, $startsAt, $coupon, $plainToken) {
            $this->lockReservation();

            $tier = ConsultationTier::query()->lockForUpdate()->findOrFail($tier->id);
            $couponId = $coupon?->id;
            $coupon = $coupon
                ? ConsultationCoupon::query()->lockForUpdate()->find($coupon->id)
                : null;

            if ($couponId && (! $coupon || ! $coupon->isValidForTier($tier->slug))) {
                throw new \InvalidArgumentException('That coupon is not valid for this plan.');
            }

            $endsAt = $startsAt->copy()->addMinutes((int) $tier->duration_minutes);

            if (! $this->availability->isSlotAvailable($tier, $startsAt, $endsAt)) {
                throw new \InvalidArgumentException('That time slot is no longer available.');
            }

            $listPrice = (int) $tier->price_cents;
            $discount = $coupon ? (int) $coupon->percent_off : 0;
            $amountDue = $coupon ? $coupon->discountedAmountCents($listPrice) : $listPrice;

            $booking = ConsultationBooking::create([
                'consultation_tier_id' => $tier->id,
                'consultation_coupon_id' => $coupon?->id,
                'client_name' => $name,
                'client_email' => $email,
                'notes' => $notes,
                'starts_at' => $startsAt,
                'ends_at' => $endsAt,
                'status' => ConsultationBooking::STATUS_PENDING_APPROVAL,
                'list_price_cents' => $listPrice,
                'discount_percent' => $discount,
                'amount_due_cents' => $amountDue,
                'currency' => config('consultation.currency', 'usd'),
                'hold_expires_at' => now('UTC')->addHours((int) config('consultation.hold_hours', 48)),
                'payment_due_at' => $startsAt->copy()->subHours((int) config('consultation.payment_cutoff_hours', 24)),
                'access_token_hash' => hash('sha256', $plainToken),
                'access_token_expires_at' => $endsAt->copy()->addDays((int) config('consultation.access_token_days', 90)),
            ]);

            $eventId = $this->google->createHoldEvent(
                'Hold: '.$tier->name.' — '.$name,
                $startsAt,
                $endsAt,
                "Pending consultation request from {$name} <{$email}>",
                'consultation-booking-'.$booking->id.'-hold',
            );

            if ($this->google->isConnected() && ! $eventId) {
                throw new \RuntimeException('Google Calendar could not create the booking hold.');
            }

            $booking->google_event_id = $eventId;
            $booking->save();

            $booking->recordEvent('requested', 'client');

            return $booking;
        });

        try {
            Mail::to(config('mail.to.address'))->send(new BookingPendingAdminMail($booking));
            Mail::to($booking->client_email)->send(new BookingPendingClientMail($booking, $plainToken));
        } catch (\Throwable $e) {
            Log::error('Consultation booking notification failed', [
                'booking' => $booking->public_id,
                'error' => $e->getMessage(),
            ]);
        }

        return ['booking' => $booking, 'plain_token' => $plainToken];
    }

    public function approve(ConsultationBooking $booking, ?string $adminNote = null): ConsultationBooking
    {
        $approval = DB::transaction(function () use ($booking, $adminNote) {
            $this->lockReservation();

            $booking = ConsultationBooking::query()
                ->with(['tier', 'coupon'])
                ->lockForUpdate()
                ->findOrFail($booking->id);

            if (! in_array($booking->status, [
                ConsultationBooking::STATUS_PENDING_APPROVAL,
                ConsultationBooking::STATUS_PAID_RESCHEDULE_PENDING_APPROVAL,
            ], true)) {
                throw new \InvalidArgumentException('Only pending bookings can be approved.');
            }

            if ($booking->hold_expires_at && $booking->hold_expires_at->isPast()) {
                throw new \InvalidArgumentException('This booking hold has expired. Ask the client to pick a later time.');
            }

            $alreadyPaid = $booking->confirmed_at !== null;

            if (! $alreadyPaid && $booking->payment_due_at && $booking->payment_due_at->isPast()) {
                throw new \InvalidArgumentException('Payment deadline has already passed for this slot. Ask the client to pick a later time.');
            }

            if (! $this->availability->isSlotAvailable($booking->tier, $booking->starts_at, $booking->ends_at, $booking->id)) {
                throw new \InvalidArgumentException('Slot is no longer free.');
            }

            $alreadyPaid = $booking->amount_due_cents > 0 && $booking->confirmed_at !== null;

            if ($booking->amount_due_cents > 0 && ! $alreadyPaid && ! $this->stripe->configured()) {
                throw new \InvalidArgumentException('Stripe payments are not configured yet.');
            }

            $booking->admin_note = $adminNote;

            if ($booking->amount_due_cents <= 0 || $alreadyPaid) {
                return [
                    'booking' => $this->confirmBookingWithinTransaction($booking, 'admin'),
                    'payment' => false,
                ];
            }

            $booking->status = ConsultationBooking::STATUS_AWAITING_PAYMENT;
            $booking->save();
            $booking->recordEvent('approved_awaiting_payment', 'admin');

            return [
                'booking' => $booking->fresh(['tier', 'coupon']),
                'payment' => true,
            ];
        });

        if (! $approval['payment']) {
            return $approval['booking'];
        }

        // Keep the approval committed while Stripe is unavailable. The
        // existing client token remains usable until checkout is created.
        $plainToken = Str::random(48);
        $checkoutUrl = $this->stripe->createCheckoutUrl($approval['booking'], $plainToken);

        if (! $checkoutUrl) {
            throw new \RuntimeException('Stripe checkout could not be created.');
        }

        $result = DB::transaction(function () use ($approval, $plainToken) {
            $booking = ConsultationBooking::query()
                ->with(['tier', 'coupon'])
                ->lockForUpdate()
                ->findOrFail($approval['booking']->id);

            if ($booking->status === ConsultationBooking::STATUS_CONFIRMED) {
                return [
                    'booking' => $booking,
                    'send_payment_mail' => false,
                ];
            }

            if ($booking->status !== ConsultationBooking::STATUS_AWAITING_PAYMENT) {
                throw new \RuntimeException('Booking is no longer awaiting payment.');
            }

            $booking->access_token_hash = hash('sha256', $plainToken);
            $booking->access_token_expires_at = $this->accessTokenExpiresAt($booking);
            $booking->save();

            return [
                'booking' => $booking->fresh(['tier', 'coupon']),
                'send_payment_mail' => true,
            ];
        });

        if ($result['send_payment_mail']) {
            try {
                Mail::to($result['booking']->client_email)->send(new BookingAwaitingPaymentMail($result['booking'], $plainToken, $checkoutUrl));
            } catch (\Throwable $e) {
                Log::error('Consultation payment email failed', [
                    'booking' => $result['booking']->public_id,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        return $result['booking'];
    }

    public function decline(ConsultationBooking $booking, bool $blockSlot = false, ?string $taskTitle = null, ?string $adminNote = null): ConsultationBooking
    {
        $result = DB::transaction(function () use ($booking, $blockSlot, $taskTitle, $adminNote) {
            $this->lockReservation();

            $booking = ConsultationBooking::query()
                ->with('tier')
                ->lockForUpdate()
                ->findOrFail($booking->id);

            if (! in_array($booking->status, [
                ConsultationBooking::STATUS_PENDING_APPROVAL,
                ConsultationBooking::STATUS_PAID_RESCHEDULE_PENDING_APPROVAL,
            ], true)) {
                throw new \InvalidArgumentException('Only pending bookings can be declined.');
            }

            $isPaidReschedule = $booking->status === ConsultationBooking::STATUS_PAID_RESCHEDULE_PENDING_APPROVAL;
            $booking->admin_note = $adminNote;
            $booking->decline_block_title = $blockSlot ? ($taskTitle ?: 'Blocked time') : null;

            if ($isPaidReschedule) {
                $deleted = $this->google->deleteEvent($booking->reschedule_hold_event_id);
                if ($this->google->isConnected() && ! $deleted) {
                    throw new \RuntimeException('Google Calendar could not release the proposed reschedule hold.');
                }

                $booking->starts_at = $booking->reschedule_original_starts_at ?? $booking->starts_at;
                $booking->ends_at = $booking->reschedule_original_ends_at ?? $booking->ends_at;
                $booking->status = ConsultationBooking::STATUS_CONFIRMED;
                $booking->proposed_slots = null;
                $booking->hold_expires_at = null;
                $booking->reschedule_original_starts_at = null;
                $booking->reschedule_original_ends_at = null;
                $booking->reschedule_hold_event_id = null;
                $booking->decline_block_title = null;
                $booking->save();
                $booking->recordEvent('reschedule_declined', 'admin');

                return [
                    'booking' => $booking->fresh(['tier']),
                    'reschedule' => true,
                ];
            }

            if ($blockSlot) {
                $title = $booking->decline_block_title ?: 'Blocked time';
                if ($booking->google_event_id) {
                    $updatedEventId = $this->google->updateEvent(
                        $booking->google_event_id,
                        $title,
                        $booking->starts_at,
                        $booking->ends_at,
                        'Blocked after declining a consultation request.',
                        'confirmed',
                    );

                    if ($this->google->isConnected() && ! $updatedEventId) {
                        throw new \RuntimeException('Google Calendar could not keep the declined slot blocked.');
                    }
                } else {
                    $booking->google_event_id = $this->google->createHoldEvent(
                        $title,
                        $booking->starts_at,
                        $booking->ends_at,
                        'Blocked after declining a consultation request.',
                        'consultation-booking-'.$booking->id.'-declined-block',
                    );

                    if ($this->google->isConnected() && ! $booking->google_event_id) {
                        throw new \RuntimeException('Google Calendar could not block the declined slot.');
                    }
                }
            } else {
                $deleted = $this->google->deleteEvent($booking->google_event_id);
                if ($this->google->isConnected() && ! $deleted) {
                    throw new \RuntimeException('Google Calendar could not release the declined booking hold.');
                }

                $booking->google_event_id = null;
            }

            $booking->status = ConsultationBooking::STATUS_DECLINED;
            $booking->save();
            $booking->recordEvent('declined', 'admin', ['block' => $blockSlot, 'title' => $booking->decline_block_title]);

            return [
                'booking' => $booking->fresh(['tier']),
                'reschedule' => false,
            ];
        });

        try {
            $booking = $result['booking'];
            Mail::to($booking->client_email)->send(
                $result['reschedule']
                    ? new BookingRescheduleDeniedMail($booking)
                    : new BookingDeclinedMail($booking),
            );
        } catch (\Throwable $e) {
            Log::error('Consultation decline email failed', [
                'booking' => $result['booking']->public_id,
                'error' => $e->getMessage(),
            ]);
        }

        return $result['booking'];
    }

    /**
     * @param  list<array{start: string, end: string}>  $slots
     */
    public function proposeReschedule(ConsultationBooking $booking, array $slots, ?string $adminNote = null): ConsultationBooking
    {
        $booking = DB::transaction(function () use ($booking, $slots, $adminNote) {
            $booking = ConsultationBooking::query()
                ->lockForUpdate()
                ->findOrFail($booking->id);

            if (! in_array($booking->status, [
                ConsultationBooking::STATUS_PENDING_APPROVAL,
                ConsultationBooking::STATUS_RESCHEDULE_REQUESTED,
            ], true)) {
                throw new \InvalidArgumentException('Cannot propose reschedule for this booking.');
            }

            $booking->status = ConsultationBooking::STATUS_RESCHEDULE_PROPOSED;
            $booking->proposed_slots = $slots;
            $booking->admin_note = $adminNote;
            $booking->hold_expires_at = now('UTC')->addHours((int) config('consultation.hold_hours', 48));
            $booking->save();
            $booking->recordEvent('reschedule_proposed', 'admin', ['slots' => $slots]);

            return $booking->fresh(['tier']);
        });

        // Send the notification before rotating the token so a mail failure
        // leaves the previously delivered booking link usable.
        $plainToken = Str::random(48);
        $mailSent = false;
        try {
            Mail::to($booking->client_email)->send(new BookingRescheduleProposedMail($booking, $plainToken));
            $mailSent = true;
        } catch (\Throwable $e) {
            Log::error('Consultation reschedule proposal email failed', [
                'booking' => $booking->public_id,
                'error' => $e->getMessage(),
            ]);
        }

        if (! $mailSent) {
            return $booking;
        }

        $booking->access_token_hash = hash('sha256', $plainToken);
        $booking->access_token_expires_at = $this->accessTokenExpiresAt($booking);
        $booking->save();

        return $booking->fresh(['tier']);
    }

    public function clientPickProposedSlot(ConsultationBooking $booking, Carbon $startsAt): ConsultationBooking
    {
        return DB::transaction(function () use ($booking, $startsAt) {
            $this->lockReservation();

            $booking = ConsultationBooking::query()
                ->with('tier')
                ->lockForUpdate()
                ->findOrFail($booking->id);

            if ($booking->status !== ConsultationBooking::STATUS_RESCHEDULE_PROPOSED) {
                throw new \InvalidArgumentException('No proposed slots to pick.');
            }

            $startsAt = $startsAt->copy()->utc();
            $endsAt = $startsAt->copy()->addMinutes((int) $booking->tier->duration_minutes);
            $iso = $startsAt->toIso8601String();

            $allowed = collect($booking->proposed_slots ?? [])->contains(function ($slot) use ($startsAt) {
                return Carbon::parse($slot['start'])->utc()->equalTo($startsAt);
            });

            if (! $allowed) {
                throw new \InvalidArgumentException('That slot was not proposed.');
            }

            if (! $this->availability->isSlotAvailable($booking->tier, $startsAt, $endsAt, $booking->id)) {
                throw new \InvalidArgumentException('That slot is no longer available.');
            }

            $wasPreviouslyConfirmed = $booking->confirmed_at !== null;
            if (! $wasPreviouslyConfirmed) {
                $deleted = $this->google->deleteEvent($booking->google_event_id);
                if ($this->google->isConnected() && ! $deleted) {
                    throw new \RuntimeException('Google Calendar could not release the previous booking hold.');
                }
            }

            $originalStartsAt = $booking->starts_at;
            $originalEndsAt = $booking->ends_at;
            $booking->starts_at = $startsAt;
            $booking->ends_at = $endsAt;
            $booking->proposed_slots = null;
            $booking->status = $wasPreviouslyConfirmed
                ? ConsultationBooking::STATUS_PAID_RESCHEDULE_PENDING_APPROVAL
                : ConsultationBooking::STATUS_PENDING_APPROVAL;
            $booking->hold_expires_at = now('UTC')->addHours((int) config('consultation.reschedule_hold_hours', 48));
            $booking->payment_due_at = $startsAt->copy()->subHours((int) config('consultation.payment_cutoff_hours', 24));
            $rescheduleKey = 'consultation-booking-'.$booking->id.'-reschedule-'.substr(
                hash('sha256', implode('|', [
                    $originalStartsAt->toIso8601String(),
                    $startsAt->toIso8601String(),
                    $booking->hold_expires_at->toIso8601String(),
                ])),
                0,
                24,
            );
            $eventId = $this->google->createHoldEvent(
                'Hold: '.$booking->tier->name.' — '.$booking->client_name,
                $startsAt,
                $endsAt,
                'Reschedule pick pending approval',
                $rescheduleKey,
            );
            if ($this->google->isConnected() && ! $eventId) {
                throw new \RuntimeException('Google Calendar could not create the booking hold.');
            }
            if ($wasPreviouslyConfirmed) {
                $booking->reschedule_original_starts_at = $originalStartsAt;
                $booking->reschedule_original_ends_at = $originalEndsAt;
                $booking->reschedule_hold_event_id = $eventId;
            } else {
                $booking->google_event_id = $eventId;
            }
            $booking->save();
            $booking->recordEvent('client_picked_proposed_slot', 'client', ['start' => $iso]);

            try {
                Mail::to(config('mail.to.address'))->send(new BookingPendingAdminMail($booking));
            } catch (\Throwable $e) {
                Log::error('Consultation reschedule notification failed', [
                    'booking' => $booking->public_id,
                    'error' => $e->getMessage(),
                ]);
            }

            return $booking->fresh(['tier']);
        });
    }

    public function confirmBooking(ConsultationBooking $booking, string $actor = 'system'): ConsultationBooking
    {
        return DB::transaction(fn () => $this->confirmBookingWithinTransaction($booking, $actor));
    }

    protected function confirmBookingWithinTransaction(ConsultationBooking $booking, string $actor): ConsultationBooking
    {
        $booking = ConsultationBooking::query()
            ->with('tier')
            ->lockForUpdate()
            ->findOrFail($booking->id);

        if ($booking->status === ConsultationBooking::STATUS_CONFIRMED) {
            return $booking;
        }

        if (! in_array($booking->status, [
            ConsultationBooking::STATUS_PENDING_APPROVAL,
            ConsultationBooking::STATUS_AWAITING_PAYMENT,
            ConsultationBooking::STATUS_PAID_RESCHEDULE_PENDING_APPROVAL,
        ], true)) {
            throw new \InvalidArgumentException('Booking cannot be confirmed from its current status.');
        }

        if (
            $booking->status === ConsultationBooking::STATUS_AWAITING_PAYMENT
            && $booking->payment_due_at
            && $booking->payment_due_at->isPast()
        ) {
            throw new \InvalidArgumentException('The payment deadline for this booking has passed.');
        }

        if (
            in_array($booking->status, [
                ConsultationBooking::STATUS_PENDING_APPROVAL,
                ConsultationBooking::STATUS_RESCHEDULE_PROPOSED,
                ConsultationBooking::STATUS_PAID_RESCHEDULE_PENDING_APPROVAL,
            ], true)
            && $booking->hold_expires_at
            && $booking->hold_expires_at->isPast()
        ) {
            throw new \InvalidArgumentException('This booking hold has expired.');
        }

        $tier = $booking->tier;
        $wasPreviouslyConfirmed = $booking->confirmed_at !== null;
        $summary = $tier->name.' — '.$booking->client_name;
        $description = trim(($booking->notes ?? '')."\n\nClient: {$booking->client_email}");

        if (! $wasPreviouslyConfirmed && $booking->consultation_coupon_id) {
            $this->redeemCoupon($booking);
        }

        $confirmationKey = 'consultation-booking-'.$booking->id.'-confirmed-'.substr(
            hash('sha256', $booking->starts_at->utc()->toIso8601String()),
            0,
            24,
        );
        $created = $this->google->createConfirmedEvent(
            $summary,
            $booking->starts_at,
            $booking->ends_at,
            $description,
            $booking->client_email,
            withMeet: true,
            idempotencyKey: $confirmationKey,
        );

        if ($this->google->isConnected() && (! $created || empty($created['event_id']) || empty($created['meet_link']))) {
            throw new \RuntimeException('Google Calendar could not create the confirmed consultation.');
        }

        foreach (array_unique(array_filter([
            $booking->google_event_id,
            $booking->reschedule_hold_event_id,
        ])) as $eventId) {
            if ($eventId === ($created['event_id'] ?? null)) {
                continue;
            }

            $deleted = $this->google->deleteEvent($eventId);
            if ($this->google->isConnected() && ! $deleted) {
                throw new \RuntimeException('Google Calendar could not release the booking hold.');
            }
        }

        $booking->status = ConsultationBooking::STATUS_CONFIRMED;
        $booking->confirmed_at = now('UTC');
        $booking->google_event_id = $created['event_id'] ?? null;
        $booking->reschedule_original_starts_at = null;
        $booking->reschedule_original_ends_at = null;
        $booking->reschedule_hold_event_id = null;
        $booking->hold_expires_at = null;
        $booking->meet_link = $created['meet_link'] ?? null;
        $booking->google_meet_space_name = null;
        $booking->save();

        if ($tier->includes_recording) {
            try {
                $spaceName = $this->google->enableMeetAutoRecording($booking->meet_link, $created['conference_id'] ?? null);
                if ($spaceName) {
                    $booking->google_meet_space_name = $spaceName;
                    $booking->save();
                } else {
                    Log::warning('Meet auto-recording could not be enabled', [
                        'booking' => $booking->public_id,
                    ]);
                }
            } catch (\Throwable $e) {
                Log::warning('Meet auto-recording setup failed', [
                    'booking' => $booking->public_id,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        $booking->recordEvent('confirmed', $actor);
        // Keep the approval/payment link valid after confirmation. The Stripe
        // return URL and the payment email both use that same token.
        try {
            Mail::to($booking->client_email)->send(new BookingConfirmedMail($booking));
        } catch (\Throwable $e) {
            Log::error('Consultation confirmation email failed', [
                'booking' => $booking->public_id,
                'error' => $e->getMessage(),
            ]);
        }

        return $booking->fresh(['tier']);
    }

    public function markPaidFromStripe(ConsultationBooking $booking, string $sessionId, ?string $paymentIntentId): ConsultationBooking
    {
        return DB::transaction(function () use ($booking, $sessionId, $paymentIntentId) {
            $booking = ConsultationBooking::query()
                ->with('tier')
                ->lockForUpdate()
                ->findOrFail($booking->id);

            if ($booking->confirmed_at !== null) {
                if ($booking->amount_due_cents > 0 && $booking->stripe_checkout_session_id !== $sessionId) {
                    throw new \InvalidArgumentException('Stripe session does not belong to this booking.');
                }

                if ($paymentIntentId && $booking->stripe_payment_intent_id && $booking->stripe_payment_intent_id !== $paymentIntentId) {
                    throw new \InvalidArgumentException('Stripe payment does not belong to this booking.');
                }

                return $booking;
            }

            if ($booking->status !== ConsultationBooking::STATUS_AWAITING_PAYMENT) {
                throw new \InvalidArgumentException('Booking is not awaiting payment.');
            }

            if ($booking->payment_due_at && $booking->payment_due_at->isPast()) {
                throw new \InvalidArgumentException('The payment deadline for this booking has passed.');
            }

            if ($booking->stripe_checkout_session_id && $booking->stripe_checkout_session_id !== $sessionId) {
                throw new \InvalidArgumentException('Stripe session does not belong to this booking.');
            }

            if ($booking->stripe_payment_intent_id && $paymentIntentId && $booking->stripe_payment_intent_id !== $paymentIntentId) {
                throw new \InvalidArgumentException('Stripe payment does not belong to this booking.');
            }

            $booking->stripe_checkout_session_id = $sessionId;
            $booking->stripe_payment_intent_id = $paymentIntentId ?: $booking->stripe_payment_intent_id;
            $booking->save();

            return $this->confirmBookingWithinTransaction($booking, 'stripe');
        });
    }

    public function requestCancel(ConsultationBooking $booking): ConsultationBooking
    {
        $booking = DB::transaction(function () use ($booking) {
            $booking = ConsultationBooking::query()
                ->lockForUpdate()
                ->findOrFail($booking->id);

            if ($booking->status !== ConsultationBooking::STATUS_CONFIRMED) {
                throw new \InvalidArgumentException('Only confirmed bookings can request cancel.');
            }

            $booking->status = ConsultationBooking::STATUS_CANCEL_REQUESTED;
            $booking->save();
            $booking->recordEvent('cancel_requested', 'client');

            return $booking->fresh(['tier']);
        });

        try {
            Mail::to(config('mail.to.address'))->send(new BookingPendingAdminMail($booking));
        } catch (\Throwable $e) {
            Log::error('Consultation cancellation notification failed', [
                'booking' => $booking->public_id,
                'error' => $e->getMessage(),
            ]);
        }

        return $booking;
    }

    public function requestReschedule(ConsultationBooking $booking, ?string $note = null): ConsultationBooking
    {
        $booking = DB::transaction(function () use ($booking, $note) {
            $booking = ConsultationBooking::query()
                ->lockForUpdate()
                ->findOrFail($booking->id);

            if ($booking->status !== ConsultationBooking::STATUS_CONFIRMED) {
                throw new \InvalidArgumentException('Only confirmed bookings can request reschedule.');
            }

            $booking->status = ConsultationBooking::STATUS_RESCHEDULE_REQUESTED;
            if ($note) {
                $booking->notes = trim(($booking->notes ? $booking->notes."\n\n" : '').'Reschedule note: '.$note);
            }
            $booking->save();
            $booking->recordEvent('reschedule_requested', 'client');

            return $booking->fresh(['tier']);
        });

        try {
            Mail::to(config('mail.to.address'))->send(new BookingPendingAdminMail($booking));
        } catch (\Throwable $e) {
            Log::error('Consultation reschedule notification failed', [
                'booking' => $booking->public_id,
                'error' => $e->getMessage(),
            ]);
        }

        return $booking;
    }

    public function approveCancel(ConsultationBooking $booking): ConsultationBooking
    {
        $booking = DB::transaction(function () use ($booking) {
            $booking = ConsultationBooking::query()
                ->lockForUpdate()
                ->findOrFail($booking->id);

            if ($booking->status !== ConsultationBooking::STATUS_CANCEL_REQUESTED) {
                throw new \InvalidArgumentException('No cancel request pending.');
            }

            if ($booking->stripe_payment_intent_id && ! $booking->stripe_refund_id) {
                $booking->stripe_refund_attempted_at ??= now('UTC');
                $booking->stripe_refund_idempotency_key ??= 'consultation-booking-'.$booking->id.'-refund';
                $booking->save();
            }

            return $booking->fresh(['tier']);
        });

        if ($booking->stripe_payment_intent_id && ! $booking->stripe_refund_id) {
            $refundId = $this->stripe->refundBooking($booking);
            if (! $refundId) {
                throw new \RuntimeException('Stripe refund could not be created.');
            }

            $booking = DB::transaction(function () use ($booking, $refundId) {
                $booking = ConsultationBooking::query()
                    ->lockForUpdate()
                    ->findOrFail($booking->id);

                if ($booking->status !== ConsultationBooking::STATUS_CANCEL_REQUESTED) {
                    throw new \InvalidArgumentException('No cancel request pending.');
                }

                $booking->stripe_refund_id ??= $refundId;
                $booking->stripe_refunded_at ??= now('UTC');
                $booking->save();

                return $booking->fresh(['tier']);
            });
        }

        $deleted = $this->google->deleteEvent($booking->google_event_id);
        if ($this->google->isConnected() && ! $deleted) {
            throw new \RuntimeException('Google Calendar could not release the cancelled consultation.');
        }

        $booking = DB::transaction(function () use ($booking) {
            $booking = ConsultationBooking::query()
                ->lockForUpdate()
                ->findOrFail($booking->id);

            if ($booking->status !== ConsultationBooking::STATUS_CANCEL_REQUESTED) {
                throw new \InvalidArgumentException('No cancel request pending.');
            }

            if ($booking->stripe_payment_intent_id && ! $booking->stripe_refund_id) {
                throw new \RuntimeException('Cancellation refund is not complete.');
            }

            $booking->status = ConsultationBooking::STATUS_CANCELLED;
            $booking->cancelled_at = now('UTC');
            $booking->google_event_id = null;
            $booking->meet_link = null;
            $booking->reschedule_original_starts_at = null;
            $booking->reschedule_original_ends_at = null;
            $booking->reschedule_hold_event_id = null;
            $booking->save();
            $booking->recordEvent('cancel_approved', 'admin');

            return $booking->fresh(['tier']);
        });

        try {
            Mail::to($booking->client_email)->send(new BookingCancelledMail($booking));
        } catch (\Throwable $e) {
            Log::error('Consultation cancellation email failed', [
                'booking' => $booking->public_id,
                'error' => $e->getMessage(),
            ]);
        }

        return $booking;
    }

    public function denyCancel(ConsultationBooking $booking): ConsultationBooking
    {
        $booking = DB::transaction(function () use ($booking) {
            $booking = ConsultationBooking::query()
                ->lockForUpdate()
                ->findOrFail($booking->id);

            if ($booking->status !== ConsultationBooking::STATUS_CANCEL_REQUESTED) {
                throw new \InvalidArgumentException('No cancel request pending.');
            }

            if ($booking->stripe_refund_attempted_at || $booking->stripe_refund_id || $booking->stripe_refunded_at) {
                throw new \InvalidArgumentException('Cancellation refund has started and cannot be denied.');
            }

            $booking->status = ConsultationBooking::STATUS_CONFIRMED;
            $booking->save();
            $booking->recordEvent('cancel_denied', 'admin');

            return $booking->fresh(['tier']);
        });

        try {
            Mail::to($booking->client_email)->send(new BookingCancellationDeniedMail($booking));
        } catch (\Throwable $e) {
            Log::error('Consultation cancellation denial email failed', [
                'booking' => $booking->public_id,
                'error' => $e->getMessage(),
            ]);
        }

        return $booking;
    }

    public function denyReschedule(ConsultationBooking $booking): ConsultationBooking
    {
        $booking = DB::transaction(function () use ($booking) {
            $booking = ConsultationBooking::query()
                ->lockForUpdate()
                ->findOrFail($booking->id);

            if ($booking->status !== ConsultationBooking::STATUS_RESCHEDULE_REQUESTED) {
                throw new \InvalidArgumentException('No reschedule request pending.');
            }

            $booking->status = ConsultationBooking::STATUS_CONFIRMED;
            $booking->save();
            $booking->recordEvent('reschedule_denied', 'admin');

            return $booking->fresh(['tier']);
        });

        try {
            Mail::to($booking->client_email)->send(new BookingRescheduleDeniedMail($booking));
        } catch (\Throwable $e) {
            Log::error('Consultation reschedule denial email failed', [
                'booking' => $booking->public_id,
                'error' => $e->getMessage(),
            ]);
        }

        return $booking;
    }

    public function expireStaleHolds(): int
    {
        $count = 0;
        $bookings = ConsultationBooking::query()
            ->whereIn('status', [
                ConsultationBooking::STATUS_PENDING_APPROVAL,
                ConsultationBooking::STATUS_RESCHEDULE_PROPOSED,
                ConsultationBooking::STATUS_PAID_RESCHEDULE_PENDING_APPROVAL,
            ])
            ->whereNotNull('hold_expires_at')
            ->where('hold_expires_at', '<', now('UTC'))
            ->get();

        foreach ($bookings as $booking) {
            try {
                if ($this->expireBooking($booking)) {
                    $count++;
                }
            } catch (\Throwable $e) {
                Log::error('Consultation hold expiration failed', [
                    'booking' => $booking->public_id,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        return $count;
    }

    public function expireUnpaidPastDeadline(): int
    {
        $count = 0;
        $bookings = ConsultationBooking::query()
            ->where('status', ConsultationBooking::STATUS_AWAITING_PAYMENT)
            ->whereNotNull('payment_due_at')
            ->where('payment_due_at', '<', now('UTC'))
            ->get();

        foreach ($bookings as $booking) {
            try {
                if ($this->expireBooking($booking)) {
                    $count++;
                }
            } catch (\Throwable $e) {
                Log::error('Consultation unpaid booking expiration failed', [
                    'booking' => $booking->public_id,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        return $count;
    }

    protected function expireBooking(ConsultationBooking $booking): bool
    {
        $result = DB::transaction(function () use ($booking) {
            $booking = ConsultationBooking::query()
                ->lockForUpdate()
                ->findOrFail($booking->id);

            $expiresAt = in_array($booking->status, [
                ConsultationBooking::STATUS_PENDING_APPROVAL,
                ConsultationBooking::STATUS_RESCHEDULE_PROPOSED,
                ConsultationBooking::STATUS_PAID_RESCHEDULE_PENDING_APPROVAL,
            ], true)
                ? $booking->hold_expires_at
                : ($booking->status === ConsultationBooking::STATUS_AWAITING_PAYMENT ? $booking->payment_due_at : null);

            if (! $expiresAt || ! $expiresAt->isPast()) {
                return null;
            }

            $isPaidReschedule = $booking->confirmed_at !== null && in_array($booking->status, [
                ConsultationBooking::STATUS_RESCHEDULE_PROPOSED,
                ConsultationBooking::STATUS_PAID_RESCHEDULE_PENDING_APPROVAL,
            ], true);

            if ($isPaidReschedule) {
                $deleted = $this->google->deleteEvent($booking->reschedule_hold_event_id);
                if ($this->google->isConnected() && ! $deleted) {
                    throw new \RuntimeException('Google Calendar could not release the expired reschedule hold.');
                }

                $booking->starts_at = $booking->reschedule_original_starts_at ?? $booking->starts_at;
                $booking->ends_at = $booking->reschedule_original_ends_at ?? $booking->ends_at;
                $booking->status = ConsultationBooking::STATUS_CONFIRMED;
                $booking->proposed_slots = null;
                $booking->hold_expires_at = null;
                $booking->reschedule_original_starts_at = null;
                $booking->reschedule_original_ends_at = null;
                $booking->reschedule_hold_event_id = null;
                $booking->save();
                $booking->recordEvent('reschedule_expired', 'system');

                return [
                    'booking' => $booking->fresh(['tier']),
                    'reschedule' => true,
                ];
            }

            $deleted = $this->google->deleteEvent($booking->google_event_id);
            if ($this->google->isConnected() && ! $deleted) {
                throw new \RuntimeException('Google Calendar could not release the expired booking hold.');
            }

            $booking->status = ConsultationBooking::STATUS_EXPIRED;
            $booking->google_event_id = null;
            $booking->hold_expires_at = null;
            $booking->save();
            $booking->recordEvent('expired', 'system');

            return [
                'booking' => $booking->fresh(['tier']),
                'reschedule' => false,
            ];
        });

        if (! $result) {
            return false;
        }

        try {
            Mail::to($result['booking']->client_email)->send(
                $result['reschedule']
                    ? new BookingRescheduleDeniedMail($result['booking'])
                    : new BookingExpiredMail($result['booking']),
            );
        } catch (\Throwable $e) {
            Log::error('Consultation expiration email failed', [
                'booking' => $result['booking']->public_id,
                'error' => $e->getMessage(),
            ]);
        }

        return true;
    }

    public function issueFreshAccessToken(ConsultationBooking $booking): string
    {
        $plain = Str::random(48);
        $booking->access_token_hash = hash('sha256', $plain);
        $booking->access_token_expires_at = $this->accessTokenExpiresAt($booking);
        $booking->save();

        return $plain;
    }

    public function assertAccessToken(ConsultationBooking $booking, ?string $plainToken): void
    {
        $this->assertAccessTokenHash(
            $booking,
            $plainToken ? hash('sha256', $plainToken) : null,
        );
    }

    public function assertAccessTokenHash(ConsultationBooking $booking, ?string $tokenHash): void
    {
        $tokenExpiresAt = $booking->access_token_expires_at ?? $this->accessTokenExpiresAt($booking);

        if (
            ! is_string($tokenHash)
            || $tokenHash === ''
            || ($tokenExpiresAt && $tokenExpiresAt->isPast())
            || in_array($booking->status, [
                ConsultationBooking::STATUS_DECLINED,
                ConsultationBooking::STATUS_EXPIRED,
                ConsultationBooking::STATUS_CANCELLED,
            ], true)
            || ! hash_equals($booking->access_token_hash, $tokenHash)
        ) {
            abort(403, 'Invalid or missing booking access token.');
        }
    }

    protected function redeemCoupon(ConsultationBooking $booking): void
    {
        $coupon = ConsultationCoupon::query()
            ->lockForUpdate()
            ->find($booking->consultation_coupon_id);

        if (! $coupon) {
            throw new \InvalidArgumentException('The booking coupon is no longer available.');
        }

        if ($coupon->max_redemptions !== null && $coupon->redeemed_count >= $coupon->max_redemptions) {
            throw new \InvalidArgumentException('The booking coupon has reached its redemption limit.');
        }

        $coupon->increment('redeemed_count');
    }

    protected function accessTokenExpiresAt(ConsultationBooking $booking): ?Carbon
    {
        if (! $booking->ends_at) {
            return null;
        }

        return $booking->ends_at->copy()->addDays((int) config('consultation.access_token_days', 90));
    }

    protected function lockReservation(): void
    {
        // A seeded settings row serializes availability reads and writes on
        // databases that support row-level locking.
        ConsultationSetting::query()
            ->where('key', 'schedule_timezone')
            ->lockForUpdate()
            ->firstOrFail();
    }
}
