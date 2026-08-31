@component('mail::message')
# Consultation confirmed

Hi {{ $booking->client_name }},

Your **{{ $booking->tier->name }}** is confirmed for **{{ $booking->starts_at->utc()->toDayDateTimeString() }} UTC**.

@if($booking->meet_link)
**Meet link:** {{ $booking->meet_link }}
@endif

@if(!empty($bookingUrl))
@component('mail::button', ['url' => $bookingUrl])
View booking
@endcomponent
@endif

Thanks,<br>
{{ config('app.name') }}
@endcomponent
