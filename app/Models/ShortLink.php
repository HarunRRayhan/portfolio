<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class ShortLink extends Model
{
    protected $fillable = [
        'code',
        'destination_url',
        'title',
        'is_active',
        'expires_at',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'expires_at' => 'datetime',
    ];

    protected $appends = ['short_url'];

    protected static function booted(): void
    {
        static::creating(function (self $link) {
            if (! $link->code) {
                $link->code = static::generateUniqueCode();
            }
        });
    }

    /**
     * A random base62 code, retried on the rare collision. 7 characters over a
     * 62-symbol alphabet is billions of combinations -- collisions are a
     * correctness concern, not a performance one, so a plain uniqueness check
     * per attempt is enough.
     */
    public static function generateUniqueCode(int $length = 7): string
    {
        do {
            $code = Str::random($length);
        } while (static::where('code', $code)->exists());

        return $code;
    }

    public function getShortUrlAttribute(): string
    {
        return url('/s/'.$this->code);
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true)
            ->where(function ($q) {
                $q->whereNull('expires_at')
                  ->orWhere('expires_at', '>', now());
            });
    }

    public function clicks(): HasMany
    {
        return $this->hasMany(ShortLinkClick::class);
    }
}
