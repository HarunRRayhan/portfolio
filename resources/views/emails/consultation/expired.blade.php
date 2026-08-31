@component('mail::message')
# Request expired

Hi {{ $booking->client_name }},

Your consultation request for **{{ $booking->starts_at->utc()->toDayDateTimeString() }} UTC** expired before it was completed.

@component('mail::button', ['url' => url('/book')])
Book again
@endcomponent

Thanks,<br>
{{ config('app.name') }}
@endcomponent
