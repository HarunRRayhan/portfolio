@php($name = \App\Support\MailText::plain($r->name))
@component('mail::message')
@if ($kind === 'received')
# Thanks for your request

I got your request for **{{ $plan }}** roadmap access ({{ $price }}) by **{{ $method }}**.

@if ($r->method === 'bkash')
I'll email you the bKash number myself, with the amount in BDT. It is a personal number, so please don't share it with anyone.

After you send the money, open your request and add the bKash transaction ID and the number you paid from. I'll unlock your access once I see it.
@else
I'll reply by email with a way to pay that works in your country.
@endif

@component('mail::button', ['url' => $requestUrl])
Open your request
@endcomponent

Keep this link to yourself: anyone with it can add payment details to your request.
@elseif ($kind === 'approved')
# You're in, {{ $name }}

Your **{{ $plan }}** access to the Intermediate and Advanced roadmap topics is on{{ $r->grant && $r->grant->expires_at->year < 2099 ? ', until '.$r->grant->expires_at->format('M j, Y') : '' }}.

Sign in with {{ \App\Support\MailText::plain($r->email) }} to use it.

@component('mail::button', ['url' => $roadmapsUrl])
Open the roadmaps
@endcomponent

Thank you for sponsoring.
@else
# {{ $r->status === 'paid' ? 'Payment details sent' : 'New payment request' }}

- Name: {{ $name }}
- Email: {{ \App\Support\MailText::plain($r->email) }}
- Country: {{ \App\Support\MailText::plain($r->country) }}
- Plan: {{ $plan }} ({{ $price }})
- Method: {{ $method }}
@if ($r->transaction_id)
- Transaction ID: {{ \App\Support\MailText::plain($r->transaction_id) }}
- Paid from: {{ \App\Support\MailText::plain((string) $r->payer_phone) }}
@endif
@if ($r->note)

Note: {{ \App\Support\MailText::plain($r->note) }}
@endif

@component('mail::button', ['url' => $adminUrl])
Review in admin
@endcomponent
@endif

{{ config('app.name') }}
@endcomponent
