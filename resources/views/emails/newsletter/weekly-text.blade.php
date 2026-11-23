This week on Harun.dev

Hi {{ $name }},

New notes from the blog, your roadmap week, and what I’m building.

@if(isset($products[0]))
Sponsor: {{ $products[0]['name'] }}
{{ $products[0]['description'] }}
{!! $track($products[0]['url']) !!}

@endif
Your roadmap week

@if($progress)
@if($progress['idle'])
You have not finished a lesson this week. Pick up where you stopped, one lesson is enough.
@else
You finished {{ $progress['lessonsWeek'] }} lesson{{ $progress['lessonsWeek'] === 1 ? '' : 's' }} and earned {{ $progress['xpWeek'] }} XP. You have {{ $progress['xpTotal'] }} XP in total.
@endif

@foreach($progress['roadmaps'] as $r)
{{ $r['title'] }}: {{ $r['done'] }} of {{ $r['total'] }} lessons ({{ $r['percent'] }}%)
Next: {{ $r['next']['title'] }}
{!! $track($r['next']['url']) !!}

@endforeach
Leaderboard: {!! $track($leaderboardUrl) !!}
@else
Follow a free roadmap on Harun.dev and this email will carry your weekly progress and your next lesson. No extra emails.
{!! $track($roadmapsUrl) !!}
@endif

@foreach($posts as $post)
{{ $post['title'] }}
{{ $post['newsletterExcerpt'] ?? $post['brief'] }}
{{ $post['publishedAtHuman'] }} · {{ $post['readTimeLabel'] }}
{!! $track($post['canonicalUrl']) !!}

@if($loop->first && isset($products[1]))
Also sponsoring this issue: {{ $products[1]['name'] }}
{{ $products[1]['description'] }}
{!! $track($products[1]['url']) !!}

@endif
@endforeach
@if(empty($posts) && isset($products[1]))
Also sponsoring this issue: {{ $products[1]['name'] }}
{{ $products[1]['description'] }}
{!! $track($products[1]['url']) !!}

@endif
@if(!empty($roadmaps))
Roadmap updates

@foreach($roadmaps as $roadmap)
{{ $roadmap['title'] }}: {{ $roadmap['summary'] }}
{!! $track($roadmap['url']) !!}

@endforeach
@endif
@if(!empty($tweets))
From my X feed

@foreach($tweets as $tweet)
{{ $tweet['text'] }}
{!! $track($tweet['url']) !!}

@endforeach
@else
More from me on X
For shorter engineering notes between newsletters, check out my X feed:
{!! $track('https://x.com/harundotdev') !!}

@endif
Know someone who'd like this? Forward this email to them.
Was this forwarded to you? Subscribe here: {!! $track($blogUrl.'?subscribe=1') !!}

Thanks for reading,
Harun R.

Browse the blog: {!! $track($blogUrl) !!}
Unsubscribe: {{ $unsubscribeUrl }}

You’re receiving this because you subscribed at Harun.dev.
© {{ date('Y') }} Harun R. Rayhan. All rights reserved.
