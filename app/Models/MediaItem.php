<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class MediaItem extends Model
{
    protected $fillable = [
        'type',
        'title',
        'slug',
        'summary',
        'url',
        'short_link_id',
        'thumbnail_path',
        'source_label',
        'published_at',
        'is_active',
        'priority',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'published_at' => 'datetime',
    ];

    protected $appends = ['thumbnail_url', 'share_url'];

    protected static function booted(): void
    {
        static::saving(function (self $item) {
            if (! $item->slug) {
                $item->slug = Str::slug($item->title);
            }

            // Resolve (or reuse) a short link whenever the destination changes,
            // so every media item points visitors through /s/{code} instead of
            // straight at the raw URL. Internal routes and mailto: come back
            // null from getOrCreateForUrl, which clears any short link a since
            // edited URL no longer needs one.
            if ($item->isDirty('url')) {
                $item->short_link_id = ShortLink::getOrCreateForUrl($item->url, $item->title)?->id;
            }
        });
    }

    /** Public URL for the stored thumbnail, or null if there isn't one. */
    public function getThumbnailUrlAttribute(): ?string
    {
        return $this->thumbnail_path
            ? Storage::disk('public')->url($this->thumbnail_path)
            : null;
    }

    /** The short link's public URL, or the raw destination if none resolved. */
    public function getShareUrlAttribute(): string
    {
        return $this->shortLink?->short_url ?? $this->url;
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true)
            ->where(function ($q) {
                $q->whereNull('published_at')
                  ->orWhere('published_at', '<=', now());
            });
    }

    public function scopeOfType(Builder $query, string $type): Builder
    {
        return $query->where('type', $type);
    }

    public function shortLink(): BelongsTo
    {
        return $this->belongsTo(ShortLink::class);
    }
}
