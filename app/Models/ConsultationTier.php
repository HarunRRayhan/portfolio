<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ConsultationTier extends Model
{
    protected $fillable = [
        'slug',
        'name',
        'price_cents',
        'duration_minutes',
        'features',
        'includes_recording',
        'includes_followup',
        'is_active',
        'sort_order',
    ];

    protected $casts = [
        'features' => 'array',
        'includes_recording' => 'boolean',
        'includes_followup' => 'boolean',
        'is_active' => 'boolean',
        'price_cents' => 'integer',
        'duration_minutes' => 'integer',
        'sort_order' => 'integer',
    ];

    public function bookings(): HasMany
    {
        return $this->hasMany(ConsultationBooking::class);
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true)->orderBy('sort_order');
    }

    public function toPublicArray(): array
    {
        return [
            'id' => $this->id,
            'slug' => $this->slug,
            'name' => $this->name,
            'price_cents' => $this->price_cents,
            'price_display' => '$'.number_format($this->price_cents / 100, 0),
            'duration_minutes' => $this->duration_minutes,
            'features' => $this->features,
            'includes_recording' => $this->includes_recording,
            'includes_followup' => $this->includes_followup,
        ];
    }
}
