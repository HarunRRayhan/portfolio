@component('mail::message')
# Thanks for sponsoring, {{ $name }}

Your consultation credits are ready.@if ($expiresAt) Use them by {{ $expiresAt->format('M j, Y') }}.@endif

@component('mail::button', ['url' => $url])
Book your call
@endcomponent

If you signed in with something other than GitHub, link your GitHub account on the booking page and the credits will show up.

{{ config('app.name') }}
@endcomponent
