<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class ConsultationBooking extends Model
{
    public const STATUS_PENDING_APPROVAL = 'pending_approval';

    public const STATUS_AWAITING_PAYMENT = 'awaiting_payment';

    public const STATUS_CONFIRMED = 'confirmed';

    public const STATUS_DECLINED = 'declined';

    public const STATUS_RESCHEDULE_PROPOSED = 'reschedule_proposed';

    public const STATUS_EXPIRED = 'expired';

    public const STATUS_CANCEL_REQUESTED = 'cancel_requested';

    public const STATUS_RESCHEDULE_REQUESTED = 'reschedule_requested';

    public const STATUS_PAID_RESCHEDULE_PENDING_APPROVAL = 'paid_reschedule_pending_approval';

    public const STATUS_CANCELLED = 'cancelled';

    protected $fillable = [
        'public_id',
        'consultation_tier_id',
        'consultation_coupon_id',
        'client_name',
        'client_email',
        'notes',
        'starts_at',
        'ends_at',
        'status',
        'list_price_cents',
        'discount_percent',
        'amount_due_cents',
        'currency',
        'stripe_checkout_session_id',
        'stripe_checkout_idempotency_key',
        'stripe_checkout_attempted_at',
        'stripe_checkout_next_attempt_at',
        'stripe_checkout_last_error',
        'stripe_checkout_rejected_session_id',
        'stripe_checkout_checked_at',
        'stripe_payment_intent_id',
        'stripe_paid_at',
        'stripe_refund_id',
        'stripe_refunded_at',
        'stripe_refund_attempted_at',
        'stripe_refund_idempotency_key',
        'google_event_id',
        'google_meet_space_name',
        'meet_link',
        'hold_expires_at',
        'payment_due_at',
        'access_token_hash',
        'access_token_expires_at',
        'proposed_slots',
        'reschedule_original_starts_at',
        'reschedule_original_ends_at',
        'reschedule_hold_event_id',
        'admin_note',
        'decline_block_title',
        'confirmed_at',
        'cancelled_at',
    ];

    protected $casts = [
        'starts_at' => 'datetime',
        'ends_at' => 'datetime',
        'hold_expires_at' => 'datetime',
        'payment_due_at' => 'datetime',
        'stripe_refunded_at' => 'datetime',
        'stripe_refund_attempted_at' => 'datetime',
        'stripe_checkout_attempted_at' => 'datetime',
        'stripe_checkout_next_attempt_at' => 'datetime',
        'stripe_paid_at' => 'datetime',
        'stripe_checkout_checked_at' => 'datetime',
        'access_token_expires_at' => 'datetime',
        'reschedule_original_starts_at' => 'datetime',
        'reschedule_original_ends_at' => 'datetime',
        'confirmed_at' => 'datetime',
        'cancelled_at' => 'datetime',
        'proposed_slots' => 'array',
        'list_price_cents' => 'integer',
        'discount_percent' => 'integer',
        'amount_due_cents' => 'integer',
    ];

    protected static function booted(): void
    {
        static::creating(function (self $booking) {
            if (! $booking->public_id) {
                $booking->public_id = strtolower((string) Str::ulid());
            }
        });
    }

    public function tier(): BelongsTo
    {
        return $this->belongsTo(ConsultationTier::class, 'consultation_tier_id');
    }

    public function coupon(): BelongsTo
    {
        return $this->belongsTo(ConsultationCoupon::class, 'consultation_coupon_id');
    }

    public function events(): HasMany
    {
        return $this->hasMany(ConsultationBookingEvent::class);
    }

    public function notifications(): HasMany
    {
        return $this->hasMany(ConsultationNotification::class);
    }

    public function googleOperations(): HasMany
    {
        return $this->hasMany(ConsultationGoogleOperation::class);
    }

    public function stripeCheckoutAttempts(): HasMany
    {
        return $this->hasMany(ConsultationStripeCheckoutAttempt::class);
    }

    public function recordEvent(string $event, ?string $actor = null, ?array $meta = null): ConsultationBookingEvent
    {
        return $this->events()->create([
            'event' => $event,
            'actor' => $actor,
            'meta' => $meta,
        ]);
    }

    public function isHoldingSlot(): bool
    {
        return in_array($this->status, [
            self::STATUS_PENDING_APPROVAL,
            self::STATUS_AWAITING_PAYMENT,
            self::STATUS_RESCHEDULE_PROPOSED,
            self::STATUS_PAID_RESCHEDULE_PENDING_APPROVAL,
            self::STATUS_CANCEL_REQUESTED,
            self::STATUS_RESCHEDULE_REQUESTED,
            self::STATUS_CONFIRMED,
        ], true);
    }

    public function accessUrl(string $plainToken): string
    {
        return url('/book/b/'.$this->public_id.'?token='.$plainToken);
    }

    public function toAdminArray(): array
    {
        $this->loadMissing('tier', 'coupon');

        return [
            'id' => $this->id,
            'public_id' => $this->public_id,
            'status' => $this->status,
            'client_name' => $this->client_name,
            'client_email' => $this->client_email,
            'notes' => $this->notes,
            'starts_at' => $this->starts_at?->utc()->toIso8601String(),
            'ends_at' => $this->ends_at?->utc()->toIso8601String(),
            'list_price_cents' => $this->list_price_cents,
            'discount_percent' => $this->discount_percent,
            'amount_due_cents' => $this->amount_due_cents,
            'hold_expires_at' => $this->hold_expires_at?->utc()->toIso8601String(),
            'payment_due_at' => $this->payment_due_at?->utc()->toIso8601String(),
            'stripe_checkout_session_id' => $this->stripe_checkout_session_id,
            'stripe_checkout_last_error' => $this->stripe_checkout_last_error,
            'stripe_checkout_next_attempt_at' => $this->stripe_checkout_next_attempt_at?->utc()->toIso8601String(),
            'stripe_checkout_rejected_session_id' => $this->stripe_checkout_rejected_session_id,
            'stripe_paid_at' => $this->stripe_paid_at?->utc()->toIso8601String(),
            'stripe_checkout_checked_at' => $this->stripe_checkout_checked_at?->utc()->toIso8601String(),
            'meet_link' => $this->meet_link,
            'admin_note' => $this->admin_note,
            'proposed_slots' => $this->proposed_slots,
            'tier' => $this->tier?->toPublicArray(),
            'coupon_code' => $this->coupon?->code,
            'created_at' => $this->created_at?->utc()->toIso8601String(),
        ];
    }

    public function toClientArray(): array
    {
        $this->loadMissing('tier');

        return [
            'public_id' => $this->public_id,
            'status' => $this->status,
            'client_name' => $this->client_name,
            'client_email' => $this->client_email,
            'notes' => $this->notes,
            'starts_at' => $this->starts_at?->utc()->toIso8601String(),
            'ends_at' => $this->ends_at?->utc()->toIso8601String(),
            'amount_due_cents' => $this->amount_due_cents,
            'discount_percent' => $this->discount_percent,
            'payment_due_at' => $this->payment_due_at?->utc()->toIso8601String(),
            'payment_received' => $this->stripe_paid_at !== null || $this->status === self::STATUS_CONFIRMED,
            'meet_link' => $this->status === self::STATUS_CONFIRMED ? $this->meet_link : null,
            'proposed_slots' => $this->proposed_slots,
            'tier' => $this->tier?->toPublicArray(),
        ];
    }
}
