<?php

namespace App\Services;

use GeoIp2\Database\Reader;
use GeoIp2\Exception\AddressNotFoundException;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Resolves a request IP to an ISO 3166-1 alpha-2 country code using a local
 * MaxMind GeoLite2-Country database.
 *
 * Every failure path returns null rather than throwing: a missing or corrupt
 * database, a private IP, or an address MaxMind has no record for. Callers
 * treat null as "country unknown" and fall back to safe defaults, so bio links
 * keep rendering even when the .mmdb has never been downloaded.
 */
class CountryResolver
{
    private ?Reader $reader = null;

    private bool $readerAttempted = false;

    public function __construct(private readonly ?string $databasePath = null) {}

    /**
     * @return string|null Uppercase two-letter country code, or null if unknown.
     */
    public function resolve(?string $ip): ?string
    {
        if ($ip === null || $ip === '' || ! $this->isPublicIp($ip)) {
            return null;
        }

        $reader = $this->reader();

        if ($reader === null) {
            return null;
        }

        try {
            return strtoupper($reader->country($ip)->country->isoCode ?? '') ?: null;
        } catch (AddressNotFoundException) {
            // Perfectly normal for unallocated ranges -- not worth logging.
            return null;
        } catch (Throwable $e) {
            Log::warning('GeoLite2 country lookup failed', [
                'exception' => $e->getMessage(),
            ]);

            return null;
        }
    }

    /**
     * Private, loopback and reserved ranges never appear in GeoLite2, and in
     * local development every request IP is one of them.
     */
    private function isPublicIp(string $ip): bool
    {
        return filter_var(
            $ip,
            FILTER_VALIDATE_IP,
            FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE,
        ) !== false;
    }

    private function reader(): ?Reader
    {
        // The database is a ~9MB memory-mapped file; open it once per process
        // and remember a failed open so we don't stat a missing file per request.
        if ($this->readerAttempted) {
            return $this->reader;
        }

        $this->readerAttempted = true;

        $path = $this->databasePath ?? config('services.maxmind.database');

        if (! $path || ! is_readable($path)) {
            return null;
        }

        try {
            $this->reader = new Reader($path);
        } catch (Throwable $e) {
            Log::warning('Could not open the GeoLite2 database', [
                'path' => $path,
                'exception' => $e->getMessage(),
            ]);
        }

        return $this->reader;
    }
}
