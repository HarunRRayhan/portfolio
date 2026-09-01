@component('mail::message')
# Reschedule request update

Hi {{ $booking->client_name }},

I couldn’t approve a new time for your **{{ $booking->tier->name }}** consultation.

Your original appointment is still scheduled for **{{ $booking->starts_at->utc()->toDayDateTimeString() }} UTC**.

If you still need a different time, reply to this email.

Thanks,<br>
{{ config('app.name') }}
@endcomponent
