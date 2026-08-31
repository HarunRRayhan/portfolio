<?php

namespace App\Services\Consultation;

use App\Mail\Consultation\BookingAwaitingPaymentMail;
use App\Mail\Consultation\BookingCancelledMail;
use App\Mail\Consultation\BookingConfirmedMail;
use App\Mail\Consultation\BookingDeclinedMail;
use App\Mail\Consultation\BookingExpiredMail;
use App\Mail\Consultation\BookingPendingAdminMail;
use App\Mail\Consultation\BookingPendingClientMail;
use App\Mail\Consultation\BookingRescheduleProposedMail;
use App\Models\ConsultationBooking;
use App\Models\ConsultationCoupon;
use App\Models\ConsultationTier;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
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
        $endsAt = $startsAt->copy()->addMinutes((int) $tier->duration_minutes);

        if (! $this->availability->isSlotAvailable($tier, $startsAt, $endsAt)) {
            throw new \InvalidArgumentException('That time slot is no longer available.');
        }

        if ($coupon && ! $coupon->isValidForTier($tier->slug)) {
            throw new \InvalidArgumentException('That coupon is not valid for this plan.');
        }

        $listPrice = (int) $tier->price_cents;
        $discount = $coupon ? (int) $coupon->percent_off : 0;
        $amountDue = $coupon ? $coupon->discountedAmountCents($listPrice) : $listPrice;

        $plainToken = Str::random(48);

        $booking = DB::transaction(function () use ($tier, $name, $email, $notes, $startsAt, $endsAt, $coupon, $listPrice, $discount, $amountDue, $plainToken) {
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
            ]);

            $eventId = $this->google->createHoldEvent(
                'Hold: '.$tier->name.' — '.$name,
                $startsAt,
                $endsAt,
                "Pending consultation request from {$name} <{$email}>"
            );
            $booking->google_event_id = $eventId;
            $booking->save();

            $booking->recordEvent('requested', 'client');

            return $booking;
        });

        Mail::to(config('mail.to.address'))->send(new BookingPendingAdminMail($booking));
        Mail::to($booking->client_email)->send(new BookingPendingClientMail($booking, $plainToken));

        return ['booking' => $booking, 'plain_token' => $plainToken];
    }

    public function approve(ConsultationBooking $booking, ?string $adminNote = null): ConsultationBooking
    {
        if ($booking->status !== ConsultationBooking::STATUS_PENDING_APPROVAL) {
            throw new \InvalidArgumentException('Only pending bookings can be approved.');
        }

        if ($booking->payment_due_at && $booking->payment_due_at->isPast()) {
            throw new \InvalidArgumentException('Payment deadline has already passed for this slot. Ask the client to pick a later time.');
        }

        if (! $this->availability->isSlotAvailable($booking->tier, $booking->starts_at, $booking->ends_at, $booking->id)) {
            throw new \InvalidArgumentException('Slot is no longer free.');
        }

        $booking->admin_note = $adminNote;

        if ($booking->amount_due_cents <= 0) {
            return $this->confirmBooking($booking, 'admin');
        }

        $booking->status = ConsultationBooking::STATUS_AWAITING_PAYMENT;
        $booking->save();
        $booking->recordEvent('approved_awaiting_payment', 'admin');

        $plainToken = $this->issueFreshAccessToken($booking);
        $checkoutUrl = $this->stripe->createCheckoutUrl($booking, $plainToken);

        Mail::to($booking->client_email)->send(new BookingAwaitingPaymentMail($booking, $plainToken, $checkoutUrl));

        return $booking->fresh(['tier', 'coupon']);
    }

    public function decline(ConsultationBooking $booking, bool $blockSlot = false, ?string $taskTitle = null, ?string $adminNote = null): ConsultationBooking
    {
        if ($booking->status !== ConsultationBooking::STATUS_PENDING_APPROVAL) {
            throw new \InvalidArgumentException('Only pending bookings can be declined.');
        }

        $booking->status = ConsultationBooking::STATUS_DECLINED;
        $booking->admin_note = $adminNote;
        $booking->decline_block_title = $blockSlot ? ($taskTitle ?: 'Blocked time') : null;
        $booking->save();
        $booking->recordEvent('declined', 'admin', ['block' => $blockSlot, 'title' => $booking->decline_block_title]);

        if ($blockSlot) {
            $title = $booking->decline_block_title ?: 'Blocked time';
            if ($booking->google_event_id) {
                $this->google->updateEvent(
                    $booking->google_event_id,
                    $title,
                    $booking->starts_at,
                    $booking->ends_at,
                    'Blocked after declining a consultation request.',
                    'confirmed',
                );
            } else {
                $booking->google_event_id = $this->google->createHoldEvent(
                    $title,
                    $booking->starts_at,
                    $booking->ends_at,
                    'Blocked after declining a consultation request.',
                );
                $booking->save();
            }
        } else {
            $this->google->deleteEvent($booking->google_event_id);
            $booking->google_event_id = null;
            $booking->save();
        }

        Mail::to($booking->client_email)->send(new BookingDeclinedMail($booking));

        return $booking->fresh(['tier']);
    }

    /**
     * @param  list<array{start: string, end: string}>  $slots
     */
    public function proposeReschedule(ConsultationBooking $booking, array $slots, ?string $adminNote = null): ConsultationBooking
    {
        if (! in_array($booking->status, [
            ConsultationBooking::STATUS_PENDING_APPROVAL,
            ConsultationBooking::STATUS_RESCHEDULE_REQUESTED,
        ], true)) {
            throw new \InvalidArgumentException('Cannot propose reschedule for this booking.');
        }

        $booking->status = ConsultationBooking::STATUS_RESCHEDULE_PROPOSED;
        $booking->proposed_slots = $slots;
        $booking->admin_note = $adminNote;
        $booking->save();
        $booking->recordEvent('reschedule_proposed', 'admin', ['slots' => $slots]);

        $plainToken = $this->issueFreshAccessToken($booking);
        Mail::to($booking->client_email)->send(new BookingRescheduleProposedMail($booking, $plainToken));

        return $booking->fresh(['tier']);
    }

    public function clientPickProposedSlot(ConsultationBooking $booking, Carbon $startsAt): ConsultationBooking
    {
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

        $this->google->deleteEvent($booking->google_event_id);

        $booking->starts_at = $startsAt;
        $booking->ends_at = $endsAt;
        $booking->proposed_slots = null;
        $booking->status = ConsultationBooking::STATUS_PENDING_APPROVAL;
        $booking->hold_expires_at = now('UTC')->addHours((int) config('consultation.hold_hours', 48));
        $booking->payment_due_at = $startsAt->copy()->subHours((int) config('consultation.payment_cutoff_hours', 24));
        $booking->google_event_id = $this->google->createHoldEvent(
            'Hold: '.$booking->tier->name.' — '.$booking->client_name,
            $startsAt,
            $endsAt,
            'Reschedule pick pending approval',
        );
        $booking->save();
        $booking->recordEvent('client_picked_proposed_slot', 'client', ['start' => $iso]);

        Mail::to(config('mail.to.address'))->send(new BookingPendingAdminMail($booking));

        return $booking->fresh(['tier']);
    }

    public function confirmBooking(ConsultationBooking $booking, string $actor = 'system'): ConsultationBooking
    {
        $tier = $booking->tier;
        $summary = $tier->name.' — '.$booking->client_name;
        $description = trim(($booking->notes ?? '')."\n\nClient: {$booking->client_email}");

        if ($booking->google_event_id) {
            $this->google->deleteEvent($booking->google_event_id);
        }

        $created = $this->google->createConfirmedEvent(
            $summary,
            $booking->starts_at,
            $booking->ends_at,
            $description,
            $booking->client_email,
            withMeet: true,
        );

        $booking->status = ConsultationBooking::STATUS_CONFIRMED;
        $booking->confirmed_at = now('UTC');
        $booking->google_event_id = $created['event_id'] ?? null;
        $booking->meet_link = $created['meet_link'] ?? null;
        $booking->google_meet_space_name = isset($created['conference_id'])
            ? 'spaces/'.$created['conference_id']
            : null;
        $booking->save();

        if ($tier->includes_recording) {
            $this->google->enableMeetAutoRecording($booking->meet_link, $created['conference_id'] ?? null);
        }

        if ($booking->consultation_coupon_id) {
            ConsultationCoupon::where('id', $booking->consultation_coupon_id)->increment('redeemed_count');
        }

        $booking->recordEvent('confirmed', $actor);
        $plainToken = $this->issueFreshAccessToken($booking);
        Mail::to($booking->client_email)->send(new BookingConfirmedMail($booking, $plainToken));

        return $booking->fresh(['tier']);
    }

    public function markPaidFromStripe(ConsultationBooking $booking, string $sessionId, ?string $paymentIntentId): ConsultationBooking
    {
        if ($booking->status === ConsultationBooking::STATUS_CONFIRMED) {
            return $booking;
        }

        if ($booking->status !== ConsultationBooking::STATUS_AWAITING_PAYMENT) {
            throw new \InvalidArgumentException('Booking is not awaiting payment.');
        }

        $booking->stripe_checkout_session_id = $sessionId;
        $booking->stripe_payment_intent_id = $paymentIntentId;
        $booking->save();

        return $this->confirmBooking($booking, 'stripe');
    }

    public function requestCancel(ConsultationBooking $booking): ConsultationBooking
    {
        if ($booking->status !== ConsultationBooking::STATUS_CONFIRMED) {
            throw new \InvalidArgumentException('Only confirmed bookings can request cancel.');
        }

        $booking->status = ConsultationBooking::STATUS_CANCEL_REQUESTED;
        $booking->save();
        $booking->recordEvent('cancel_requested', 'client');

        Mail::to(config('mail.to.address'))->send(new BookingPendingAdminMail($booking));

        return $booking;
    }

    public function requestReschedule(ConsultationBooking $booking, ?string $note = null): ConsultationBooking
    {
        if ($booking->status !== ConsultationBooking::STATUS_CONFIRMED) {
            throw new \InvalidArgumentException('Only confirmed bookings can request reschedule.');
        }

        $booking->status = ConsultationBooking::STATUS_RESCHEDULE_REQUESTED;
        if ($note) {
            $booking->notes = trim(($booking->notes ? $booking->notes."\n\n" : '').'Reschedule note: '.$note);
        }
        $booking->save();
        $booking->recordEvent('reschedule_requested', 'client');

        Mail::to(config('mail.to.address'))->send(new BookingPendingAdminMail($booking));

        return $booking;
    }

    public function approveCancel(ConsultationBooking $booking): ConsultationBooking
    {
        if ($booking->status !== ConsultationBooking::STATUS_CANCEL_REQUESTED) {
            throw new \InvalidArgumentException('No cancel request pending.');
        }

        $this->google->deleteEvent($booking->google_event_id);
        $booking->status = ConsultationBooking::STATUS_CANCELLED;
        $booking->cancelled_at = now('UTC');
        $booking->google_event_id = null;
        $booking->meet_link = null;
        $booking->save();
        $booking->recordEvent('cancel_approved', 'admin');

        Mail::to($booking->client_email)->send(new BookingCancelledMail($booking));

        return $booking;
    }

    public function denyCancel(ConsultationBooking $booking): ConsultationBooking
    {
        if ($booking->status !== ConsultationBooking::STATUS_CANCEL_REQUESTED) {
            throw new \InvalidArgumentException('No cancel request pending.');
        }

        $booking->status = ConsultationBooking::STATUS_CONFIRMED;
        $booking->save();
        $booking->recordEvent('cancel_denied', 'admin');

        return $booking;
    }

    public function denyReschedule(ConsultationBooking $booking): ConsultationBooking
    {
        if ($booking->status !== ConsultationBooking::STATUS_RESCHEDULE_REQUESTED) {
            throw new \InvalidArgumentException('No reschedule request pending.');
        }

        $booking->status = ConsultationBooking::STATUS_CONFIRMED;
        $booking->save();
        $booking->recordEvent('reschedule_denied', 'admin');

        return $booking;
    }

    public function expireStaleHolds(): int
    {
        $count = 0;
        $bookings = ConsultationBooking::query()
            ->where('status', ConsultationBooking::STATUS_PENDING_APPROVAL)
            ->whereNotNull('hold_expires_at')
            ->where('hold_expires_at', '<', now('UTC'))
            ->get();

        foreach ($bookings as $booking) {
            $this->expireBooking($booking);
            $count++;
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
            $this->expireBooking($booking);
            $count++;
        }

        return $count;
    }

    protected function expireBooking(ConsultationBooking $booking): void
    {
        $this->google->deleteEvent($booking->google_event_id);
        $booking->status = ConsultationBooking::STATUS_EXPIRED;
        $booking->google_event_id = null;
        $booking->save();
        $booking->recordEvent('expired', 'system');
        Mail::to($booking->client_email)->send(new BookingExpiredMail($booking));
    }

    public function issueFreshAccessToken(ConsultationBooking $booking): string
    {
        $plain = Str::random(48);
        $booking->access_token_hash = hash('sha256', $plain);
        $booking->save();

        return $plain;
    }

    public function assertAccessToken(ConsultationBooking $booking, ?string $plainToken): void
    {
        if (! $plainToken || ! hash_equals($booking->access_token_hash, hash('sha256', $plainToken))) {
            abort(403, 'Invalid or missing booking access token.');
        }
    }
}
