<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class BioLink extends Model
{
    protected $fillable = [
        'label',
        'url',
        'short_link_id',
        'tab',
        'tab_slug',
        'icon',
        'thumbnail_path',
        'featured',
        'priority',
        'expires_at',
        'is_active',
        'include_countries',
        'exclude_countries',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'is_active' => 'boolean',
        'featured' => 'boolean',
        'include_countries' => 'array',
        'exclude_countries' => 'array',
    ];

    protected $appends = ['thumbnail_url'];

    /** Public URL for the stored thumbnail, or null if there isn't one. */
    public function getThumbnailUrlAttribute(): ?string
    {
        return $this->thumbnail_path
            ? Storage::disk('public')->url($this->thumbnail_path)
            : null;
    }

    protected static function booted(): void
    {
        static::saving(function (self $link) {
            if ($link->isDirty('tab')) {
                $tab = $link->tab ?? 'default';
                $link->tab_slug = $tab === 'default' ? 'default' : Str::slug($tab);
            }

            // Resolve (or reuse) a short link whenever the destination changes,
            // so every bio link points visitors through /s/{code} instead of
            // straight at the raw URL. Internal routes and mailto: come back
            // null from getOrCreateForUrl, which clears any short link a since
            // edited URL no longer needs one.
            if ($link->isDirty('url')) {
                $link->short_link_id = ShortLink::getOrCreateForUrl($link->url, $link->label)?->id;
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

    public function shortLink(): BelongsTo
    {
        return $this->belongsTo(ShortLink::class);
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
