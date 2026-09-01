<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ConsultationGoogleOperation extends Model
{
    public const STATUS_PENDING = 'pending';

    public const STATUS_PROCESSING = 'processing';

    public const STATUS_FAILED = 'failed';

    public const STATUS_SUCCEEDED = 'succeeded';

    public const STATUS_NEEDS_ATTENTION = 'needs_attention';

    protected $fillable = [
        'consultation_booking_id',
        'operation_key',
        'operation',
        'payload',
        'status',
        'attempts',
        'last_error',
        'available_at',
        'completed_at',
    ];

    protected $casts = [
        'payload' => 'encrypted:array',
        'attempts' => 'integer',
        'available_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    public function booking(): BelongsTo
    {
        return $this->belongsTo(ConsultationBooking::class, 'consultation_booking_id');
    }
}
