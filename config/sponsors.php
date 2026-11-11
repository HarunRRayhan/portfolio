<?php

$handle = env('GITHUB_SPONSORS_HANDLE', 'HarunRRayhan');

return [
    'handle' => $handle,
    'webhook_secret' => env('GITHUB_SPONSORS_WEBHOOK_SECRET'),
    'url' => 'https://github.com/sponsors/'.$handle,
    'one_time_days' => 60,

    // slug => GitHub tier node id, kind, and what a sponsorship grants.
    // calls: consultation tier slug => count. Unmapped GitHub tiers are donations.
    'tiers' => [
        'pro' => [
            'node_id' => env('GITHUB_SPONSORS_TIER_PRO'),
            'url' => env('GITHUB_SPONSORS_TIER_PRO_URL'),
            'kind' => 'one_time',
            'calls' => ['pro' => 1],
            'scans' => 0,
        ],
        'max' => [
            'node_id' => env('GITHUB_SPONSORS_TIER_MAX'),
            'url' => env('GITHUB_SPONSORS_TIER_MAX_URL'),
            'kind' => 'one_time',
            'calls' => ['max' => 1],
            'scans' => 0,
        ],
        'ultra' => [
            'node_id' => env('GITHUB_SPONSORS_TIER_ULTRA'),
            'url' => env('GITHUB_SPONSORS_TIER_ULTRA_URL'),
            'kind' => 'one_time',
            'calls' => ['ultra' => 1],
            'scans' => 0,
        ],
        'monthly' => [
            'node_id' => env('GITHUB_SPONSORS_TIER_MONTHLY'),
            'url' => env('GITHUB_SPONSORS_TIER_MONTHLY_URL'),
            'kind' => 'monthly',
            'calls' => ['max' => 2],
            'scans' => 1,
        ],
    ],
];
