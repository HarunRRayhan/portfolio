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

    /**
     * Whether this link should be shown to a visitor in $country.
     *
     * Filtering happens in PHP rather than SQL: the link set is small enough to
     * load whole, and Postgres json columns need a jsonb cast before
     * whereJsonContains works, which would tie the query to one driver.
     *
     * A null $country means the lookup failed. Include rules then fail closed
     * (we cannot prove the visitor qualifies) while exclude rules fail open (we
     * cannot prove they don't), so a missing GeoLite2 database degrades to
     * showing the unrestricted links instead of emptying the page.
     */
    public function isVisibleInCountry(?string $country): bool
    {
        $country = $country ? strtoupper($country) : null;

        // Tolerate a raw json string as well as an array: a double-encoded value
        // written before the cast was in place should not 500 the public page.
        $normalise = function (mixed $list): array {
            if (is_string($list)) {
                $list = json_decode($list, true);
            }

            return is_array($list)
                ? array_map(strtoupper(...), array_filter($list, is_string(...)))
                : [];
        };

        $include = $normalise($this->include_countries);
        $exclude = $normalise($this->exclude_countries);

        if ($exclude !== [] && $country !== null && in_array($country, $exclude, true)) {
            return false;
        }

        if ($include !== []) {
            return $country !== null && in_array($country, $include, true);
        }

        return true;
    }
}
