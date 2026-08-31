@component('mail::message')
# Consultation request update

Hi {{ $booking->client_name }},

Unfortunately we can’t take the **{{ $booking->tier->name }}** slot you requested for **{{ $booking->starts_at->utc()->toDayDateTimeString() }} UTC**.

You’re welcome to pick another time on the booking page.

@component('mail::button', ['url' => url('/book')])
Book again
@endcomponent

Thanks,<br>
{{ config('app.name') }}
@endcomponent
