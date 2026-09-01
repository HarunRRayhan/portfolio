@component('mail::message')
# Cancellation request update

Hi {{ $booking->client_name }},

Your request to cancel the **{{ $booking->tier->name }}** scheduled for **{{ $booking->starts_at->utc()->toDayDateTimeString() }} UTC** was not approved.

The consultation is still scheduled for the time above.

If your plans change again, reply to this email.

Thanks,<br>
{{ config('app.name') }}
@endcomponent
