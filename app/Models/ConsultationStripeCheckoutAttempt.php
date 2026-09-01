<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ConsultationStripeCheckoutAttempt extends Model
{
    public const STATUS_PENDING = 'pending';

    public const STATUS_PROCESSING = 'processing';

    public const STATUS_FAILED = 'failed';

    public const STATUS_CREATED = 'created';

    public const STATUS_SUPERSEDED = 'superseded';

    protected $fillable = [
        'consultation_booking_id',
        'idempotency_key',
        'access_token',
        'stripe_checkout_session_id',
        'status',
        'attempts',
        'last_error',
        'next_attempt_at',
        'completed_at',
    ];

    protected $casts = [
        'access_token' => 'encrypted',
        'attempts' => 'integer',
        'next_attempt_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    public function booking(): BelongsTo
    {
        return $this->belongsTo(ConsultationBooking::class, 'consultation_booking_id');
    }
}
