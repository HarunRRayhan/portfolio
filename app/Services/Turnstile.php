<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class Turnstile
{
    public static function enabled(): bool
    {
        return (string) config('services.turnstile.secret_key') !== '';
    }

    public static function verify(?string $token, ?string $ip): bool
    {
        if (! self::enabled() || ! is_string($token) || $token === '') {
            return false;
        }

        try {
            return Http::asForm()->timeout(5)->post('https://challenges.cloudflare.com/turnstile/v0/siteverify', [
                'secret' => config('services.turnstile.secret_key'),
                'response' => $token,
                'remoteip' => $ip,
            ])->json('success') === true;
        } catch (\Throwable) {
            return false;
        }
    }
}
