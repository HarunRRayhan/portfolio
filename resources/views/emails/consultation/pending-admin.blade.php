@component('mail::message')
# New consultation request

**Plan:** {{ $booking->tier->name }}  
**Client:** {{ $booking->client_name }} &lt;{{ $booking->client_email }}&gt;  
@if($booking->company_name)
**Company:** {{ $booking->company_name }}<br>
@endif
**When (UTC):** {{ $booking->starts_at->utc()->toDayDateTimeString() }}  
**Status:** {{ $booking->status }}

@if($booking->notes)
**Notes:** {{ $booking->notes }}
@endif

@component('mail::button', ['url' => url('/admin/consultations/bookings/'.$booking->id)])
Review in admin
@endcomponent

Thanks,<br>
{{ config('app.name') }}
@endcomponent
