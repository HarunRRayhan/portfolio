@component('mail::message')
# This week on Harun.dev

Here are the latest engineering notes from the blog.

@foreach($posts as $post)
@if(!empty($post['coverImageUrl']))
![{{ $post['coverImageAlt'] ?? $post['title'] }}]({{ $post['coverImageUrl'] }})
@endif

## [{{ $post['title'] }}]({{ $post['canonicalUrl'] }})

{{ $post['brief'] }}

{{ $post['publishedAtHuman'] }} · {{ $post['readTimeLabel'] }}

@component('mail::button', ['url' => $post['canonicalUrl']])
Read the post
@endcomponent

@endforeach
You’re one of {{ number_format($subscriberCount) }} readers getting these notes.

You’re receiving this because you subscribed at {{ config('app.name') }}. [Unsubscribe]({{ $unsubscribeUrl }})

Thanks,<br>
{{ config('app.name') }}
@endcomponent
