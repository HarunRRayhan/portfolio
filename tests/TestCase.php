<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
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
