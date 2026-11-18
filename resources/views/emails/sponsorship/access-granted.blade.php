@component('mail::message')
# Thank you for sponsoring

Your access to the Intermediate and Advanced roadmap topics is on{{ $until ? ', until '.$until : ', for life' }}.

Sign in with {{ \App\Support\MailText::plain($email) }} to use it.@if ($xp > 0) You also get {{ number_format($xp) }} XP and a Sponsor tag on the leaderboard.@endif

@component('mail::button', ['url' => $url])
Open the roadmaps
@endcomponent

{{ config('app.name') }}
@endcomponent
