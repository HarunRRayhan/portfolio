@component('mail::message')
# {{ $provider }} sign-in was linked

Someone signed in to your {{ config('app.name') }} account with {{ $provider }}, using this email address. From now on, that {{ $provider }} account can sign in to yours.

@component('mail::button', ['url' => $url])
Review your account
@endcomponent

If this wasn’t you, sign in with an email link and delete the account, or reply to this email.

Thanks,<br>
{{ config('app.name') }}
@endcomponent
