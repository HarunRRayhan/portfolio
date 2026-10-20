This week on Harun.dev

New notes from the blog, plus a couple of things I’m building.

@if(isset($products[0]))
{{ $products[0]['name'] }}
{{ $products[0]['description'] }}
{!! $track($products[0]['url']) !!}

@endif
@foreach($posts as $post)
{{ $post['title'] }}
{{ $post['newsletterExcerpt'] ?? $post['brief'] }}
{{ $post['publishedAtHuman'] }} · {{ $post['readTimeLabel'] }}
{!! $track($post['canonicalUrl']) !!}

@if($loop->first && isset($products[1]))
{{ $products[1]['name'] }}
{{ $products[1]['description'] }}
{!! $track($products[1]['url']) !!}

@endif
@endforeach
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
Thanks for reading,
Harun R.

Browse the blog: {!! $track($blogUrl) !!}
Unsubscribe: {{ $unsubscribeUrl }}

You’re receiving this because you subscribed at Harun.dev.
© {{ date('Y') }} Harun R. Rayhan. All rights reserved.
