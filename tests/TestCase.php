<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Support\Facades\Cache;

abstract class TestCase extends BaseTestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        // /raystack fetches its GitHub star count and latest release; tests never call GitHub.
        Cache::put('raystack.github.stars', false);
        Cache::put('raystack.github.version', false);
    }

    /**
     * Headers for an Inertia "subsequent navigation" request -- returns
     * page-data JSON instead of the full HTML shell. The version must match
     * what Inertia computes server-side (a hash of the Vite manifest), or
     * the request 409s asking for a full reload instead.
     */
    protected function inertiaHeaders(): array
    {
        return [
            'X-Inertia' => 'true',
            'X-Inertia-Version' => hash_file('xxh128', public_path('build/manifest.json')),
        ];
    }
}
