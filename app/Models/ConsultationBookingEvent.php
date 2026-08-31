<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ConsultationBookingEvent extends Model
{
    protected $fillable = [
        'consultation_booking_id',
        'event',
        'actor',
        'meta',
    ];

    protected $casts = [
        'meta' => 'array',
    ];

    public function booking(): BelongsTo
    {
        return $this->belongsTo(ConsultationBooking::class, 'consultation_booking_id');
    }
}
