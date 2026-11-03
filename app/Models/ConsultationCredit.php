<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ConsultationCredit extends Model
{
    public const KIND_CALL = 'call';

    public const KIND_SCAN = 'scan';

    protected $fillable = [
        'github_sponsorship_id',
        'user_id',
        'kind',
        'consultation_tier_id',
        'period_start',
        'slot',
        'expires_at',
        'used_by_booking_id',
        'used_at',
        'scan_repo_url',
        'revoked_at',
        'reminded_at',
    ];

    protected function casts(): array
    {
        return [
            'period_start' => 'date',
            'expires_at' => 'datetime',
            'used_at' => 'datetime',
            'revoked_at' => 'datetime',
            'reminded_at' => 'datetime',
        ];
    }

    public function sponsorship(): BelongsTo
    {
        return $this->belongsTo(GithubSponsorship::class, 'github_sponsorship_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function tier(): BelongsTo
    {
        return $this->belongsTo(ConsultationTier::class, 'consultation_tier_id');
    }

    public function booking(): BelongsTo
    {
        return $this->belongsTo(ConsultationBooking::class, 'used_by_booking_id');
    }

    public function scopeUsable(Builder $query): Builder
    {
        return $query->whereNull('used_at')
            ->whereNull('used_by_booking_id')
            ->whereNull('revoked_at')
            ->where('expires_at', '>', now());
    }
}
