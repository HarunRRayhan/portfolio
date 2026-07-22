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
        'url_hash',
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

        static::saving(function (self $link) {
            if ($link->isDirty('destination_url')) {
                $link->url_hash = static::hashFor($link->destination_url);
            }
        });
    }

    /**
     * Trim and lowercase the scheme/host so trivial variants (a trailing
     * slash, mixed-case host, http vs. HTTP) hash the same, without touching
     * path/query/fragment -- those can be case-sensitive and genuinely change
     * the destination.
     */
    public static function normalizeUrl(string $url): string
    {
        $url = trim($url);
        $parts = parse_url($url);

        if (! $parts || ! isset($parts['scheme'], $parts['host'])) {
            return $url;
        }

        $scheme = strtolower($parts['scheme']);
        $host = strtolower($parts['host']);
        $port = isset($parts['port']) ? ':'.$parts['port'] : '';
        $path = isset($parts['path']) ? rtrim($parts['path'], '/') : '';
        $query = isset($parts['query']) ? '?'.$parts['query'] : '';
        $fragment = isset($parts['fragment']) ? '#'.$parts['fragment'] : '';

        return "{$scheme}://{$host}{$port}{$path}{$query}{$fragment}";
    }

    public static function hashFor(string $url): string
    {
        return hash('sha256', static::normalizeUrl($url));
    }

    /**
     * Look up a link for $url without creating one -- the shared detection
     * both getOrCreateForUrl() and the admin dedup check build on.
     *
     * Returns null for anything that isn't worth shortening (internal
     * routes, mailto:, tel:), or when nothing matches yet. Otherwise: if the
     * URL is already one of our own /s/{code} links, that link. Failing
     * that, any existing link with the same normalized URL.
     */
    public static function findForUrl(string $url): ?self
    {
        $parts = parse_url($url);

        if (! $parts || ! in_array($parts['scheme'] ?? null, ['http', 'https'], true)) {
            return null;
        }

        $ourHost = parse_url(config('app.url'), PHP_URL_HOST);

        if ($ourHost && strcasecmp($parts['host'] ?? '', $ourHost) === 0
            && preg_match('#^/s/([^/]+)/?$#', $parts['path'] ?? '', $match)) {
            $existing = static::where('code', $match[1])->first();

            if ($existing) {
                return $existing;
            }
        }

        return static::where('url_hash', static::hashFor($url))->first();
    }

    /**
     * The single place both the bio-link saving hook and the admin "create
     * short link" form go through, so a URL never gets shortened twice.
     * Reuses whatever findForUrl() turns up; only creates when nothing does.
     */
    public static function getOrCreateForUrl(string $url, ?string $title = null): ?self
    {
        if (! preg_match('#^https?://#i', $url)) {
            return null;
        }

        return static::findForUrl($url) ?? static::create([
            'destination_url' => $url,
            'title' => $title,
        ]);
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
