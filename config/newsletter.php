<?php

return [
    'max_posts' => min(3, max(1, (int) env('NEWSLETTER_MAX_POSTS', 3))),

    'schedule' => [
        'day' => (int) env('NEWSLETTER_SEND_DAY', 2),
        'time' => env('NEWSLETTER_SEND_TIME', '11:00'),
        'timezone' => env('NEWSLETTER_TIMEZONE', 'America/New_York'),
    ],

    'products' => [
        ['key' => 'toolblip', 'name' => 'Toolblip', 'url' => 'https://toolblip.com', 'logoUrl' => 'https://harun.dev/images/products/toolblip-email.png', 'description' => 'Developer tools that run in your browser, with no signup.'],
        ['key' => 'cloudploy', 'name' => 'CloudPloy', 'url' => 'https://cloudploy.com', 'logoUrl' => 'https://harun.dev/images/products/cloudploy-email.png', 'description' => 'Deploy apps from Claude Code, Cursor, or any MCP client to a server you own or provision.'],
        ['key' => 'crontinel', 'name' => 'Crontinel', 'url' => 'https://crontinel.com', 'logoUrl' => 'https://harun.dev/images/products/crontinel.png', 'description' => 'Catch failed cron jobs, stuck queues, and silent worker failures.'],
        ['key' => 'appnary', 'name' => 'Appnary', 'url' => 'https://appnary.com', 'logoUrl' => 'https://harun.dev/images/products/appnary-email.png', 'description' => 'Shopify apps for merchants, starting with ad pixel tracking.'],
        ['key' => 'amazingplugins', 'name' => 'Amazing Plugins', 'url' => 'https://amazingplugins.com', 'logoUrl' => 'https://harun.dev/images/products/amazingplugins.jpg', 'description' => 'Free WooCommerce plugins that solve specific store problems.'],
    ],

    // Add two or three curated posts here: ['text' => 'Post text', 'url' => 'https://x.com/harundotdev/status/...'].
    'tweets' => [],
];
