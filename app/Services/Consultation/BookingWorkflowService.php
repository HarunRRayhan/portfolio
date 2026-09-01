<?php

namespace App\Services\Consultation;

use App\Models\ConsultationBooking;
use App\Models\ConsultationCoupon;
use App\Models\ConsultationSetting;
use App\Models\ConsultationTier;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class BookingWorkflowService
{
    public function __construct(
        protected AvailabilityService $availability,
        protected GoogleCalendarService $google,
        protected StripeCheckoutService $stripe,
        protected ConsultationNotificationService $notifications,
        protected ConsultationGoogleOperationService $googleOperations,
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
        $googleConnected = $this->google->isConnected();

        $result = DB::transaction(function () use ($tier, $name, $email, $notes, $startsAt, $coupon, $plainToken, $googleConnected) {
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

            $requestEvent = $booking->recordEvent('requested', 'client');

            $googleOperation = null;
            if ($googleConnected) {
                $googleOperation = $this->googleOperations->queue(
                    $booking,
                    'hold',
                    [
                        'summary' => 'Hold: '.$tier->name.' — '.$name,
                        'starts_at' => $startsAt->toIso8601String(),
                        'ends_at' => $endsAt->toIso8601String(),
                        'description' => "Pending consultation request from {$name} <{$email}>",
                        'idempotency_key' => 'consultation-booking-'.$booking->id.'-hold',
                    ],
                );
            }

            $this->notifications->enqueue(
                $booking,
                config('mail.to.address'),
                ConsultationNotificationService::TYPE_PENDING_ADMIN,
                [],
                'consultation-booking-'.$booking->id.'-event-'.$requestEvent->id.'-requested-admin',
            );
            $this->notifications->enqueue(
                $booking,
                $booking->client_email,
                ConsultationNotificationService::TYPE_PENDING_CLIENT,
                ['plain_token' => $plainToken],
                'consultation-booking-'.$booking->id.'-event-'.$requestEvent->id.'-requested-client',
            );

            return [
                'booking' => $booking,
                'google_operation' => $googleOperation,
            ];
        });

        $booking = $result['booking'];
        $googleOperation = $result['google_operation'];

        if ($googleOperation) {
            try {
                if ($this->googleOperations->run($googleOperation, $this)) {
                    $booking = $booking->fresh();
                }
            } catch (\Throwable $e) {
                $this->googleOperations->recordFailure($booking, 'hold', $googleOperation->payload ?? [], $e);
                Log::error('Consultation booking hold creation failed', [
                    'booking' => $booking->public_id,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        $this->notifications->deliverDueForBooking($booking->id);

        return ['booking' => $booking, 'plain_token' => $plainToken];
    }

    public function approve(ConsultationBooking $booking, ?string $adminNote = null): ConsultationBooking
    {
        try {
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
        } catch (\Throwable $e) {
            $this->recordGoogleFailure($booking, 'approve', ['admin_note' => $adminNote], $e);

            throw $e;
        }

        if (! $approval['payment']) {
            $this->notifications->deliverDueForBooking($approval['booking']->id);

            return $approval['booking'];
        }

        // Keep the approval committed while Stripe is unavailable. The
        // existing client token remains usable until checkout is created.
        $plainToken = Str::random(48);
        $checkoutUrl = $this->stripe->createCheckoutUrl($approval['booking'], $plainToken);

        if (! $checkoutUrl) {
            throw new \RuntimeException('Stripe checkout could not be created.');
        }

        $result = DB::transaction(function () use ($approval, $plainToken, $checkoutUrl) {
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

            $this->notifications->enqueue(
                $booking,
                $booking->client_email,
                ConsultationNotificationService::TYPE_AWAITING_PAYMENT,
                [
                    'plain_token' => $plainToken,
                    'checkout_url' => $checkoutUrl,
                ],
                'consultation-booking-'.$booking->id.'-awaiting-payment-'.$booking->stripe_checkout_session_id,
            );

            return [
                'booking' => $booking->fresh(['tier', 'coupon']),
                'send_payment_mail' => true,
            ];
        });

        $this->notifications->deliverDueForBooking($result['booking']->id);

        return $result['booking'];
    }

    public function decline(ConsultationBooking $booking, bool $blockSlot = false, ?string $taskTitle = null, ?string $adminNote = null): ConsultationBooking
    {
        try {
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
                    $decisionEvent = $booking->recordEvent('reschedule_declined', 'admin');
                    $this->notifications->enqueue(
                        $booking,
                        $booking->client_email,
                        ConsultationNotificationService::TYPE_RESCHEDULE_DENIED,
                        [],
                        'consultation-booking-'.$booking->id.'-event-'.$decisionEvent->id.'-reschedule-declined',
                    );

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
                $decisionEvent = $booking->recordEvent('declined', 'admin', ['block' => $blockSlot, 'title' => $booking->decline_block_title]);

                $this->notifications->enqueue(
                    $booking,
                    $booking->client_email,
                    ConsultationNotificationService::TYPE_DECLINED,
                    [],
                    'consultation-booking-'.$booking->id.'-event-'.$decisionEvent->id.'-declined',
                );

                return [
                    'booking' => $booking->fresh(['tier']),
                    'reschedule' => false,
                ];
            });
        } catch (\Throwable $e) {
            $this->recordGoogleFailure($booking, 'decline', [
                'block_slot' => $blockSlot,
                'task_title' => $taskTitle,
                'admin_note' => $adminNote,
            ], $e);

            throw $e;
        }

        $this->notifications->deliverDueForBooking($result['booking']->id);

        return $result['booking'];
    }

    /**
     * @param  list<array{start: string, end: string}>  $slots
     */
    public function proposeReschedule(ConsultationBooking $booking, array $slots, ?string $adminNote = null): ConsultationBooking
    {
        $plainToken = Str::random(48);

        $booking = DB::transaction(function () use ($booking, $slots, $adminNote, $plainToken) {
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
            $proposalEvent = $booking->recordEvent('reschedule_proposed', 'admin', ['slots' => $slots]);

            $this->notifications->enqueue(
                $booking,
                $booking->client_email,
                ConsultationNotificationService::TYPE_RESCHEDULE_PROPOSED,
                [
                    'plain_token' => $plainToken,
                    'activate_access_token_hash' => hash('sha256', $plainToken),
                    'activate_access_token_expires_at' => $this->accessTokenExpiresAt($booking)?->toIso8601String(),
                ],
                'consultation-booking-'.$booking->id.'-event-'.$proposalEvent->id.'-reschedule-proposed',
            );

            return $booking->fresh(['tier']);
        });

        $this->notifications->deliverDueForBooking($booking->id);

        return $booking->fresh(['tier']);
    }

    public function clientPickProposedSlot(ConsultationBooking $booking, Carbon $startsAt): ConsultationBooking
    {
        try {
            $booking = DB::transaction(function () use ($booking, $startsAt) {
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
                $pickEvent = $booking->recordEvent('client_picked_proposed_slot', 'client', ['start' => $iso]);

                $this->notifications->enqueue(
                    $booking,
                    config('mail.to.address'),
                    ConsultationNotificationService::TYPE_PENDING_ADMIN,
                    [],
                    'consultation-booking-'.$booking->id.'-event-'.$pickEvent->id.'-picked',
                );

                return $booking->fresh(['tier']);
            });
        } catch (\Throwable $e) {
            $this->recordGoogleFailure($booking, 'client_pick', [
                'starts_at' => $startsAt->copy()->utc()->toIso8601String(),
            ], $e);

            throw $e;
        }

        $this->notifications->deliverDueForBooking($booking->id);

        return $booking;
    }

    public function confirmBooking(ConsultationBooking $booking, string $actor = 'system'): ConsultationBooking
    {
        try {
            $result = DB::transaction(fn () => $this->confirmBookingWithinTransaction($booking, $actor));
        } catch (\Throwable $e) {
            $this->recordGoogleFailure($booking, 'confirm', ['actor' => $actor], $e);

            throw $e;
        }

        $this->notifications->deliverDueForBooking($result->id);

        return $result;
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

        $wasPreviouslyConfirmed = $booking->confirmed_at !== null;

        if (
            $booking->status === ConsultationBooking::STATUS_AWAITING_PAYMENT
            && ! $booking->stripe_paid_at
            && $booking->payment_due_at
            && $booking->payment_due_at->isPast()
        ) {
            throw new \InvalidArgumentException('The payment deadline for this booking has passed.');
        }

        if (
            $booking->amount_due_cents > 0
            && ! $wasPreviouslyConfirmed
            && ! $booking->stripe_paid_at
        ) {
            throw new \InvalidArgumentException('Payment is required before confirming this booking.');
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

        if ($tier->includes_recording && $this->google->isConnected()) {
            try {
                $spaceName = $this->google->enableMeetAutoRecording($booking->meet_link, $created['conference_id'] ?? null);
                if ($spaceName) {
                    $booking->google_meet_space_name = $spaceName;
                    $booking->save();
                } else {
                    $this->googleOperations->queue(
                        $booking,
                        'meet_recording',
                        [
                            'meet_link' => $booking->meet_link,
                            'conference_id' => $created['conference_id'] ?? null,
                        ],
                        'Meet auto-recording was not enabled.',
                    );
                    Log::warning('Meet auto-recording could not be enabled', [
                        'booking' => $booking->public_id,
                    ]);
                }
            } catch (\Throwable $e) {
                $this->googleOperations->queue(
                    $booking,
                    'meet_recording',
                    [
                        'meet_link' => $booking->meet_link,
                        'conference_id' => $created['conference_id'] ?? null,
                    ],
                    $e->getMessage(),
                );
                Log::warning('Meet auto-recording setup failed', [
                    'booking' => $booking->public_id,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        $confirmationEvent = $booking->recordEvent('confirmed', $actor);
        $this->notifications->enqueue(
            $booking,
            $booking->client_email,
            ConsultationNotificationService::TYPE_CONFIRMED,
            [],
            'consultation-booking-'.$booking->id.'-event-'.$confirmationEvent->id.'-confirmed',
        );

        return $booking->fresh(['tier']);
    }

    /** @param array{meet_link?: ?string, conference_id?: ?string} $payload */
    public function retryMeetRecording(ConsultationBooking $booking, array $payload): void
    {
        if ($booking->status !== ConsultationBooking::STATUS_CONFIRMED) {
            throw new \InvalidArgumentException('The consultation is no longer confirmed.');
        }

        $spaceName = $this->google->enableMeetAutoRecording(
            $payload['meet_link'] ?? $booking->meet_link,
            $payload['conference_id'] ?? null,
        );

        if (! $spaceName) {
            throw new \RuntimeException('Google Meet auto-recording could not be enabled.');
        }

        DB::transaction(function () use ($booking, $spaceName): void {
            $current = ConsultationBooking::query()->lockForUpdate()->findOrFail($booking->id);
            if ($current->status !== ConsultationBooking::STATUS_CONFIRMED) {
                return;
            }

            $current->google_meet_space_name = $spaceName;
            $current->save();
        });
    }

    /** @param array{summary?: string, starts_at?: string, ends_at?: string, description?: string, idempotency_key?: string} $payload */
    public function retryCreateHold(ConsultationBooking $booking, array $payload): ?string
    {
        $current = $booking->fresh();

        if ($current->status !== ConsultationBooking::STATUS_PENDING_APPROVAL) {
            throw new \InvalidArgumentException('The consultation hold is no longer needed.');
        }

        if ($current->hold_expires_at && $current->hold_expires_at->isPast()) {
            throw new \InvalidArgumentException('The consultation hold has expired.');
        }

        $eventId = $this->google->createHoldEvent(
            (string) ($payload['summary'] ?? 'Consultation hold'),
            Carbon::parse((string) ($payload['starts_at'] ?? $current->starts_at))->utc(),
            Carbon::parse((string) ($payload['ends_at'] ?? $current->ends_at))->utc(),
            (string) ($payload['description'] ?? ''),
            (string) ($payload['idempotency_key'] ?? 'consultation-booking-'.$current->id.'-hold'),
        );

        if (! $eventId) {
            throw new \RuntimeException('Google Calendar could not create the booking hold.');
        }

        $attached = DB::transaction(function () use ($current, $eventId): bool {
            $locked = ConsultationBooking::query()->lockForUpdate()->findOrFail($current->id);

            if ($locked->status !== ConsultationBooking::STATUS_PENDING_APPROVAL) {
                return false;
            }

            if (! $locked->google_event_id) {
                $locked->google_event_id = $eventId;
                $locked->save();
            }

            return true;
        });

        if (! $attached) {
            $deleted = $this->google->deleteEvent($eventId);
            if ($this->google->isConnected() && ! $deleted) {
                throw new \RuntimeException('Google Calendar could not clean up the stale consultation hold.');
            }

            return null;
        }

        return $eventId;
    }

    public function retryExpiredBooking(ConsultationBooking $booking): bool
    {
        return $this->expireBooking($booking);
    }

    public function markPaidFromStripe(ConsultationBooking $booking, string $sessionId, ?string $paymentIntentId): ConsultationBooking
    {
        $booking = DB::transaction(function () use ($booking, $sessionId, $paymentIntentId): ConsultationBooking {
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

            if (! $booking->stripe_paid_at && $booking->payment_due_at && $booking->payment_due_at->isPast()) {
                throw new \InvalidArgumentException('The payment deadline for this booking has passed.');
            }

            if ($booking->amount_due_cents > 0 && (! is_string($paymentIntentId) || $paymentIntentId === '')) {
                throw new \InvalidArgumentException('Stripe payment intent was missing.');
            }

            if ($booking->stripe_checkout_session_id && $booking->stripe_checkout_session_id !== $sessionId) {
                throw new \InvalidArgumentException('Stripe session does not belong to this booking.');
            }

            if ($booking->stripe_payment_intent_id && $paymentIntentId && $booking->stripe_payment_intent_id !== $paymentIntentId) {
                throw new \InvalidArgumentException('Stripe payment does not belong to this booking.');
            }

            $booking->stripe_checkout_session_id = $sessionId;
            $booking->stripe_payment_intent_id = $paymentIntentId ?: $booking->stripe_payment_intent_id;
            $booking->stripe_paid_at ??= now('UTC');
            $booking->save();

            return $booking->fresh(['tier']);
        });

        return $this->confirmBooking($booking, 'stripe');
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
            $requestEvent = $booking->recordEvent('cancel_requested', 'client');
            $this->notifications->enqueue(
                $booking,
                config('mail.to.address'),
                ConsultationNotificationService::TYPE_PENDING_ADMIN,
                [],
                'consultation-booking-'.$booking->id.'-event-'.$requestEvent->id.'-cancel-requested',
            );

            return $booking->fresh(['tier']);
        });

        $this->notifications->deliverDueForBooking($booking->id);

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
            $requestEvent = $booking->recordEvent('reschedule_requested', 'client');
            $this->notifications->enqueue(
                $booking,
                config('mail.to.address'),
                ConsultationNotificationService::TYPE_PENDING_ADMIN,
                [],
                'consultation-booking-'.$booking->id.'-event-'.$requestEvent->id.'-reschedule-requested',
            );

            return $booking->fresh(['tier']);
        });

        $this->notifications->deliverDueForBooking($booking->id);

        return $booking;
    }

    public function approveCancel(ConsultationBooking $booking): ConsultationBooking
    {
        try {
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
                $decisionEvent = $booking->recordEvent('cancel_approved', 'admin');
                $this->notifications->enqueue(
                    $booking,
                    $booking->client_email,
                    ConsultationNotificationService::TYPE_CANCELLED,
                    [],
                    'consultation-booking-'.$booking->id.'-event-'.$decisionEvent->id.'-cancelled',
                );

                return $booking->fresh(['tier']);
            });

            $this->notifications->deliverDueForBooking($booking->id);

            return $booking;
        } catch (\Throwable $e) {
            $this->recordGoogleFailure($booking, 'approve_cancel', [], $e);

            throw $e;
        }
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
            $decisionEvent = $booking->recordEvent('cancel_denied', 'admin');
            $this->notifications->enqueue(
                $booking,
                $booking->client_email,
                ConsultationNotificationService::TYPE_CANCELLATION_DENIED,
                [],
                'consultation-booking-'.$booking->id.'-event-'.$decisionEvent->id.'-cancel-denied',
            );

            return $booking->fresh(['tier']);
        });

        $this->notifications->deliverDueForBooking($booking->id);

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
            $decisionEvent = $booking->recordEvent('reschedule_denied', 'admin');
            $this->notifications->enqueue(
                $booking,
                $booking->client_email,
                ConsultationNotificationService::TYPE_RESCHEDULE_DENIED,
                [],
                'consultation-booking-'.$booking->id.'-event-'.$decisionEvent->id.'-reschedule-denied',
            );

            return $booking->fresh(['tier']);
        });

        $this->notifications->deliverDueForBooking($booking->id);

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
                $this->recordGoogleFailure($booking, 'expire', [], $e);
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
            ->whereNull('stripe_paid_at')
            ->whereNotNull('payment_due_at')
            ->where('payment_due_at', '<', now('UTC'))
            ->get();

        foreach ($bookings as $booking) {
            try {
                if ($this->expireBooking($booking)) {
                    $count++;
                }
            } catch (\Throwable $e) {
                $this->recordGoogleFailure($booking, 'expire', [], $e);
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

            if (
                $booking->status === ConsultationBooking::STATUS_AWAITING_PAYMENT
                && $booking->stripe_paid_at
            ) {
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
                $expiryEvent = $booking->recordEvent('reschedule_expired', 'system');
                $this->notifications->enqueue(
                    $booking,
                    $booking->client_email,
                    ConsultationNotificationService::TYPE_RESCHEDULE_DENIED,
                    [],
                    'consultation-booking-'.$booking->id.'-event-'.$expiryEvent->id.'-reschedule-expired',
                );

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
            $expiryEvent = $booking->recordEvent('expired', 'system');
            $this->notifications->enqueue(
                $booking,
                $booking->client_email,
                ConsultationNotificationService::TYPE_EXPIRED,
                [],
                'consultation-booking-'.$booking->id.'-event-'.$expiryEvent->id.'-expired',
            );

            return [
                'booking' => $booking->fresh(['tier']),
                'reschedule' => false,
            ];
        });

        if (! $result) {
            return false;
        }

        $this->notifications->deliverDueForBooking($result['booking']->id);

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

    protected function recordGoogleFailure(
        ConsultationBooking $booking,
        string $operation,
        array $payload,
        \Throwable $exception,
    ): void {
        if (! $this->isGoogleFailure($exception)) {
            return;
        }

        try {
            $this->googleOperations->recordFailure($booking, $operation, $payload, $exception);
        } catch (\Throwable $recordingException) {
            Log::error('Could not persist Google consultation retry', [
                'booking' => $booking->public_id,
                'operation' => $operation,
                'error' => $recordingException->getMessage(),
            ]);
        }
    }

    protected function isGoogleFailure(\Throwable $exception): bool
    {
        $message = strtolower($exception->getMessage());

        return str_contains($message, 'google calendar') || str_contains($message, 'google meet');
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
