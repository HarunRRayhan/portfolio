@component('mail::message')
# {{ $messageSubject }}

**From:** {{ $name }} &lt;{{ $email }}&gt;

{{ $messageContent }}

@if(count($services) > 0)
**Services:** {{ implode(', ', $services) }}
@endif

<small>Referrer: {{ $referrer }}</small>

@component('mail::button', ['url' => rtrim(config('app.url'), '/').'/admin/contacts'])
Open in admin
@endcomponent

Reply to this email to answer {{ $name }} directly.
@endcomponent
