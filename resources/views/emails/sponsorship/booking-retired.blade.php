@component('mail::message')
# Your request was closed

Hi {{ $name }}, consultations now run on GitHub Sponsors instead of card payments, so I closed your unpaid request. Nothing was charged.

To book a call, sponsor on GitHub and pick a slot on the booking page.

@component('mail::button', ['url' => $url])
See how it works
@endcomponent

{{ config('app.name') }}
@endcomponent
