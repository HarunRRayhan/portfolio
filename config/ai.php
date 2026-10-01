<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Origin crawl budget
    |--------------------------------------------------------------------------
    |
    | Named search and AI crawlers may read the site, including for training.
    | Everyone still has a per-IP cap so a client cannot scrape at full speed.
    | The cap is stored outside the database cache (see LimitContentCrawls).
    |
    */

    'crawl_limit_enabled' => filter_var(env('AI_CRAWL_LIMIT_ENABLED', 'true'), FILTER_VALIDATE_BOOL),

    'limits' => [
        'search_ai' => (int) env('AI_CRAWL_LIMIT_SEARCH_AI', 300),
        'browser' => (int) env('AI_CRAWL_LIMIT_BROWSER', 120),
        'bulk' => (int) env('AI_CRAWL_LIMIT_BULK', 20),
    ],

    /*
    |--------------------------------------------------------------------------
    | IndexNow (Bing and other participating engines)
    |--------------------------------------------------------------------------
    |
    | Hex key, 8–128 characters. Published at /{key}.txt. Not a secret from
    | the web — IndexNow fetches it to prove this host asked for the recrawl.
    |
    */

    'indexnow_key' => env('INDEXNOW_KEY'),

    /*
    |--------------------------------------------------------------------------
    | Bing Webmaster Tools
    |--------------------------------------------------------------------------
    |
    | The content attribute from the msvalidate.01 meta tag only.
    |
    */

    'bing_site_verification' => env('BING_SITE_VERIFICATION'),

];
