<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ConsultationNotification extends Model
{
    public const STATUS_PENDING = 'pending';

    public const STATUS_PROCESSING = 'processing';

    public const STATUS_FAILED = 'failed';

    public const STATUS_SENT = 'sent';

    protected $fillable = [
        'consultation_booking_id',
        'deduplication_key',
        'recipient',
        'mail_type',
        'payload',
        'status',
        'attempts',
        'last_error',
        'available_at',
        'sent_at',
    ];

    protected $casts = [
        'payload' => 'encrypted:array',
        'attempts' => 'integer',
        'available_at' => 'datetime',
        'sent_at' => 'datetime',
    ];

    public function booking(): BelongsTo
    {
        return $this->belongsTo(ConsultationBooking::class, 'consultation_booking_id');
    }
}
