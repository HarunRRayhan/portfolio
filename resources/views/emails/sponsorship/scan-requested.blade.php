@component('mail::message')
# Open-source scan requested

{{-- Raw output is safe here: CommonMark escapes everything inside code. --}}
{{ \App\Support\MailText::plain($userName) }} ({!! \App\Support\MailText::code($userEmail) !!}) used a scan credit.

Repo: {!! \App\Support\MailText::code($repoUrl) !!}

@if ($notes)
Notes:

{!! \App\Support\MailText::code($notes, true) !!}
@endif

{{ config('app.name') }}
@endcomponent
