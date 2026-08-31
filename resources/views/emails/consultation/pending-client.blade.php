@component('mail::message')
# Request received

Hi {{ $booking->client_name }},

We received your **{{ $booking->tier->name }}** request for **{{ $booking->starts_at->utc()->toDayDateTimeString() }} UTC**.

Harun will review it shortly. You’ll get another email once it’s approved (with a payment link if needed), declined, or if a different time is proposed.

@if($bookingUrl)
@component('mail::button', ['url' => $bookingUrl])
View your request
@endcomponent
@endif

Thanks,<br>
{{ config('app.name') }}
@endcomponent
