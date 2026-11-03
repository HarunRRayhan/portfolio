@component('mail::message')
# Open-source scan requested

{{ $userName }} ({{ $userEmail }}) used a scan credit.

Repo: {{ $repoUrl }}

@if ($notes)
Notes:

{{ $notes }}
@endif

{{ config('app.name') }}
@endcomponent
