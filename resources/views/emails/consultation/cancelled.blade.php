@component('mail::message')
# Consultation cancelled

Hi {{ $booking->client_name }},

Your **{{ $booking->tier->name }}** scheduled for **{{ $booking->starts_at->utc()->toDayDateTimeString() }} UTC** has been cancelled.

@component('mail::button', ['url' => url('/book')])
Book again
@endcomponent

Thanks,<br>
{{ config('app.name') }}
@endcomponent
