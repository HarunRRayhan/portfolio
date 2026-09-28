This week on Harun.dev

New notes from the blog, plus a couple of things I’m building.

@if(isset($products[0]))
{{ $products[0]['name'] }}
{{ $products[0]['description'] }}
{{ $products[0]['url'] }}

@endif
@foreach($posts as $post)
{{ $post['title'] }}
{{ $post['newsletterExcerpt'] ?? $post['brief'] }}
{{ $post['publishedAtHuman'] }} · {{ $post['readTimeLabel'] }}
{{ $post['canonicalUrl'] }}

@if($loop->first && isset($products[1]))
{{ $products[1]['name'] }}
{{ $products[1]['description'] }}
{{ $products[1]['url'] }}

@endif
@endforeach
@if(!empty($tweets))
From my X feed

@foreach($tweets as $tweet)
{{ $tweet['text'] }}
{{ $tweet['url'] }}

@endforeach
@else
More from me on X
For shorter engineering notes between newsletters, check out my X feed:
https://x.com/harundotdev

@endif
Thanks for reading,
Harun R.

Browse the blog: {{ $blogUrl }}
Unsubscribe: {{ $unsubscribeUrl }}

You’re receiving this because you subscribed at Harun.dev.
© {{ date('Y') }} Harun R. Rayhan. All rights reserved.
