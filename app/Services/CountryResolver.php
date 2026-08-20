<?php

namespace App\Services;

use Illuminate\Http\Request;

/**
 * Resolves a visitor's country from Cloudflare's Cf-Ipcountry header.
 *
 * Cloudflare stamps this on every request it proxies, resolved at the edge --
 * no local database, no license key, no scheduled refresh. This is only safe
 * to trust because the app's origin has no public route that bypasses
 * Cloudflare (see the Railway service domains); otherwise the header could be
 * forged by hitting the origin directly.
 */
class CountryResolver
{
    /**
     * @return string|null Uppercase two-letter country code, or null if unknown.
     */
    public function resolve(Request $request): ?string
    {
        $country = strtoupper((string) $request->header('Cf-Ipcountry'));

        // "XX" is Cloudflare's sentinel for "couldn't determine a location".
        if ($country === 'XX' || ! preg_match('/^[A-Z]{2}$/', $country)) {
            return null;
        }

        return $country;
    }
}
