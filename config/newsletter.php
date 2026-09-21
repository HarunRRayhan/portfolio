<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Weekly newsletter
    |--------------------------------------------------------------------------
    |
    | The scheduler still runs when sending is disabled. This lets a deploy
    | validate the command without sending mail until the production variables
    | are in place.
    |
    */

    'enabled' => filter_var(env('NEWSLETTER_ENABLED', false), FILTER_VALIDATE_BOOLEAN),

    'max_posts' => max(1, (int) env('NEWSLETTER_MAX_POSTS', 3)),

    'schedule' => [
        'day' => (int) env('NEWSLETTER_SEND_DAY', 1),
        'time' => env('NEWSLETTER_SEND_TIME', '09:00'),
        'timezone' => env('NEWSLETTER_TIMEZONE', 'Asia/Dhaka'),
    ],
];
