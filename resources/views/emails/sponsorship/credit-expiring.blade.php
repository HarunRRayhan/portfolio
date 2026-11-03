@component('mail::message')
# Your call credit is about to run out

Hi {{ $name }}, your consultation credit expires on {{ $expiresAt->format('M j, Y') }}. If you want the call, book a slot before then.

@component('mail::button', ['url' => $url])
Book your call
@endcomponent

{{ config('app.name') }}
@endcomponent
