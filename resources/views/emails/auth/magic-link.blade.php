@component('mail::message')
# Sign in to {{ config('app.name') }}

Use the button below to sign in. The link works once and expires in 15 minutes.

@component('mail::button', ['url' => $url])
Sign in
@endcomponent

If you didn’t ask for this, you can ignore this email.

Thanks,<br>
{{ config('app.name') }}
@endcomponent
