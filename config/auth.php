<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Super Admin Emails
    |--------------------------------------------------------------------------
    |
    | Comma-separated list of emails granted the admin role automatically
    | on first login (or on promotion if they already exist). Used by the
    | social authentication flow and the RegisteredUserController.
    |
    */

    'super_admin_emails' => array_values(array_filter(array_map(
        fn (string $email) => strtolower(trim($email, " \t\n\r\0\x0B\"'")),
        explode(',', (string) env('SUPER_ADMIN_EMAILS', ''))
    ))),

];
