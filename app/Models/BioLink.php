<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class BioLink extends Model
{
    protected $fillable = [
        'label',
        'url',
        'tab',
        'tab_slug',
        'icon',
        'priority',
        'expires_at',
        'is_active',
        'include_countries',
        'exclude_countries',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'is_active' => 'boolean',
        'include_countries' => 'array',
        'exclude_countries' => 'array',
    ];

    protected static function booted(): void
    {
        static::saving(function (self $link) {
            if ($link->isDirty('tab')) {
                $tab = $link->tab ?? 'default';
                $link->tab_slug = $tab === 'default' ? 'default' : Str::slug($tab);
            }
        });
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
        return $this->hasMany(BioLinkClick::class);
    }
}
