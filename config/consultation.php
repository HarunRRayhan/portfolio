<?php

return [

    'currency' => 'usd',

    'buffer_minutes' => 15,

    'min_lead_hours' => 48,

    'hold_hours' => 48,

    'payment_cutoff_hours' => 24,

    'slot_interval_minutes' => 15,

    'default_schedule_timezone' => env('CONSULTATION_SCHEDULE_TIMEZONE', 'UTC'),

    'calendar_id' => env('CONSULTATION_GOOGLE_CALENDAR_ID', 'primary'),

    /*
    |--------------------------------------------------------------------------
    | Google Calendar OAuth (separate from site login Google app if needed)
    |--------------------------------------------------------------------------
    */
    'google' => [
        'client_id' => env('CONSULTATION_GOOGLE_CLIENT_ID', env('GOOGLE_CLIENT_ID')),
        'client_secret' => env('CONSULTATION_GOOGLE_CLIENT_SECRET', env('GOOGLE_CLIENT_SECRET')),
        'redirect' => env('CONSULTATION_GOOGLE_REDIRECT_URI', env('APP_URL').'/admin/consultations/google/callback'),
        'scopes' => [
            'https://www.googleapis.com/auth/calendar',
            'https://www.googleapis.com/auth/calendar.events',
            'https://www.googleapis.com/auth/meetings.space.settings',
            'https://www.googleapis.com/auth/meetings.space.created',
            'https://www.googleapis.com/auth/userinfo.email',
            'openid',
        ],
    ],

];
