Hi {{ $name }},

@if($d['idle'])
You have not finished a lesson this week. Pick up where you stopped, one lesson is enough.
@else
This week you finished {{ $d['lessonsWeek'] }} lesson{{ $d['lessonsWeek'] === 1 ? '' : 's' }} and earned {{ $d['xpWeek'] }} XP. You have {{ $d['xpTotal'] }} XP in total.
@endif

@foreach($d['roadmaps'] as $r)
{{ $r['title'] }}: {{ $r['done'] }} of {{ $r['total'] }} lessons ({{ $r['percent'] }}%)
Next: {{ $r['next']['title'] }}
{!! $r['next']['url'] !!}

@endforeach
Leaderboard: {!! $leaderboardUrl !!}

You get this because you subscribed to the Harun.dev newsletter and follow a roadmap.
Unsubscribe: {!! $unsubscribeUrl !!}
