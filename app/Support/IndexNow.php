<?php

namespace App\Support;

use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;

/**
 * Notifies IndexNow (Bing and the other participating engines) that URLs changed.
 */
final class IndexNow
{
    public static function key(): string
    {
        return strtolower(trim((string) config('ai.indexnow_key')));
    }

    public static function configured(): bool
    {
        return (bool) preg_match('/^[a-f0-9]{8,128}$/', self::key());
    }

    public static function acceptsSite(string $site): bool
    {
        return (bool) preg_match('/^https:\/\/[a-z0-9.-]+$/i', rtrim($site, '/'));
    }

    /**
     * @param  list<string>  $urls
     */
    public static function submit(string $site, array $urls): Response
    {
        $site = rtrim($site, '/');
        $key = self::key();
        $host = (string) parse_url($site, PHP_URL_HOST);

        return Http::timeout(20)
            ->acceptJson()
            ->post('https://api.indexnow.org/indexnow', [
                'host' => $host,
                'key' => $key,
                'keyLocation' => $site.'/'.$key.'.txt',
                'urlList' => array_values(array_slice($urls, 0, 10000)),
            ]);
    }
}
