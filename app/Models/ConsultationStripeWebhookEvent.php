<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ConsultationStripeWebhookEvent extends Model
{
    public const STATUS_PROCESSING = 'processing';

    public const STATUS_FAILED = 'failed';

    public const STATUS_PROCESSED = 'processed';

    protected $fillable = [
        'event_id',
        'type',
        'status',
        'attempts',
        'consultation_booking_id',
        'last_error',
        'processed_at',
    ];

    protected $casts = [
        'attempts' => 'integer',
        'processed_at' => 'datetime',
    ];

    public function booking(): BelongsTo
    {
        return $this->belongsTo(ConsultationBooking::class, 'consultation_booking_id');
    }
}
