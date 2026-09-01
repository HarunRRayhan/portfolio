@component('mail::message')
# Unmatched Stripe webhook

Stripe sent a consultation payment event that could not be linked to a booking.

**Event:** {{ $eventId }}
**Type:** {{ $eventType }}
**Reason:** {{ $reason }}

@if($sessionId)
**Checkout session:** {{ $sessionId }}
@endif

@if($bookingPublicId)
**Booking reference:** {{ $bookingPublicId }}
@endif

Check the Stripe dashboard and the consultation webhook ledger before taking action.

{{ config('app.name') }}
@endcomponent
