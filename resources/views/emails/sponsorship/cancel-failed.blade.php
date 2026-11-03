@component('mail::message')
# Booking cancel failed

A sponsorship ended, but this booking could not be cancelled automatically.

**Booking:** {{ $bookingPublicId }}
**Error:** {{ $error }}

Cancel it by hand from the admin consultations list.

{{ config('app.name') }}
@endcomponent
