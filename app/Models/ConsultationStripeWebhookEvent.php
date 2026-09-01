<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ConsultationStripeWebhookEvent extends Model
{
    public const STATUS_PROCESSING = 'processing';

    public const STATUS_FAILED = 'failed';

    public const STATUS_PROCESSED = 'processed';

    public const STATUS_UNMATCHED = 'unmatched';

    protected $fillable = [
        'event_id',
        'type',
        'payload',
        'status',
        'attempts',
        'consultation_booking_id',
        'booking_public_id',
        'stripe_checkout_session_id',
        'last_error',
        'unmatched_at',
        'next_attempt_at',
        'processed_at',
    ];

    protected $casts = [
        'payload' => 'encrypted',
        'attempts' => 'integer',
        'unmatched_at' => 'datetime',
        'next_attempt_at' => 'datetime',
        'processed_at' => 'datetime',
    ];

    public function booking(): BelongsTo
    {
        return $this->belongsTo(ConsultationBooking::class, 'consultation_booking_id');
    }
}
