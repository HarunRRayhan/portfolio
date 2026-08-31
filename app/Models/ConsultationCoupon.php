<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ConsultationCoupon extends Model
{
    protected $fillable = [
        'code',
        'percent_off',
        'tier_slugs',
        'max_redemptions',
        'redeemed_count',
        'expires_at',
        'is_active',
    ];

    protected $casts = [
        'tier_slugs' => 'array',
        'percent_off' => 'integer',
        'max_redemptions' => 'integer',
        'redeemed_count' => 'integer',
        'expires_at' => 'datetime',
        'is_active' => 'boolean',
    ];

    public function bookings(): HasMany
    {
        return $this->hasMany(ConsultationBooking::class);
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    public function isValidForTier(string $tierSlug): bool
    {
        if (! $this->is_active) {
            return false;
        }

        if ($this->expires_at && $this->expires_at->isPast()) {
            return false;
        }

        if ($this->max_redemptions !== null && $this->redeemed_count >= $this->max_redemptions) {
            return false;
        }

        $slugs = $this->tier_slugs ?? [];

        return in_array($tierSlug, $slugs, true);
    }

    public function discountedAmountCents(int $listPriceCents): int
    {
        $off = min(100, max(0, $this->percent_off));

        return (int) max(0, (int) round($listPriceCents * (100 - $off) / 100));
    }
}
