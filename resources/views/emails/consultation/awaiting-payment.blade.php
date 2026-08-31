@component('mail::message')
# Approved — complete payment

Hi {{ $booking->client_name }},

Your **{{ $booking->tier->name }}** on **{{ $booking->starts_at->utc()->toDayDateTimeString() }} UTC** is approved.

Amount due: **${{ number_format($booking->amount_due_cents / 100, 2) }}**  
Pay before: **{{ $booking->payment_due_at?->utc()->toDayDateTimeString() }} UTC**

@if($checkoutUrl)
@component('mail::button', ['url' => $checkoutUrl])
Pay with Stripe
@endcomponent
@elseif(!empty($bookingUrl))
@component('mail::button', ['url' => $bookingUrl])
Open booking
@endcomponent
@endif

Thanks,<br>
{{ config('app.name') }}
@endcomponent
