@component('mail::message')
# Pick a new time

Hi {{ $booking->client_name }},

Harun proposed new times for your **{{ $booking->tier->name }}**. Open your booking page to choose one.

@if(!empty($bookingUrl))
@component('mail::button', ['url' => $bookingUrl])
Choose a time
@endcomponent
@endif

Thanks,<br>
{{ config('app.name') }}
@endcomponent
