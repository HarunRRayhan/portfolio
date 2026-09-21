<?php

return [
    'stripe_secret' => env('STRIPE_SPONSOR_SECRET'),

    'currency' => 'usd',

    'min_amount_cents' => 100,

    'max_amount_cents' => 1_000_000,

    'suggested_amount_cents' => [
        500,
        1_000,
        2_500,
        5_000,
    ],
];
