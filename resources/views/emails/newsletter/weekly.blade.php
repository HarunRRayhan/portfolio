<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>This week on Harun.dev</title>
    <style>
        @media screen and (max-width: 740px) {
            .newsletter { width: 100% !important; }
            .inset { padding-left: 24px !important; padding-right: 24px !important; }
            .post-title { font-size: 24px !important; }
        }
    </style>
</head>
<body style="margin:0;padding:0;background:#f3f5f7;color:#17212e;font-family:Arial,Helvetica,sans-serif;">
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#f3f5f7;">
    <tr><td align="center" style="padding:28px 12px;">
        <a href="{{ rtrim(config('app.url'), '/') }}" style="display:block;margin:0 0 18px;text-decoration:none;"><img src="https://harun.dev/images/brand/harun-logo-wordmark-email.png" alt="Harun.dev" width="240" height="60" style="display:block;width:240px;height:60px;max-width:100%;border:0;"></a>
        <table role="presentation" class="newsletter" cellpadding="0" cellspacing="0" width="720" style="width:720px;max-width:100%;background:#ffffff;border:1px solid #dce2e8;">
            <tr><td class="inset" style="padding:38px 42px 20px;">
                <h1 style="margin:0 0 12px;color:#17212e;font-size:32px;line-height:1.2;">This week on Harun.dev</h1>
                <p style="margin:0;color:#516071;font-size:16px;line-height:1.6;">New notes from the blog, plus a couple of things I’m building.</p>
            </td></tr>
            @if(isset($products[0]))
            <tr><td class="inset" style="padding:20px 42px 24px;">
                <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#edf4fa;border-left:3px solid #28679a;">
                    <tr><td style="padding:22px 24px;">
                        <p style="margin:0 0 8px;color:#35617e;font-size:13px;font-weight:700;">From my desk</p>
                        <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 12px;"><tr>
                            @if(!empty($products[0]['logoUrl']))
                            <td width="64" style="width:64px;vertical-align:middle;"><a href="{{ $products[0]['url'] }}"><img src="{{ $products[0]['logoUrl'] }}" alt="{{ $products[0]['name'] }} logo" width="52" height="52" style="display:block;width:52px;height:52px;border:0;border-radius:10px;"></a></td>
                            @endif
                            <td style="vertical-align:middle;"><h2 style="margin:0;font-size:21px;line-height:1.3;"><a href="{{ $products[0]['url'] }}" style="color:#173c5c;text-decoration:none;">{{ $products[0]['name'] }}</a></h2></td>
                        </tr></table>
                        <p style="margin:0 0 12px;color:#34485a;font-size:15px;line-height:1.55;">{{ $products[0]['description'] }}</p>
                        <a href="{{ $products[0]['url'] }}" style="color:#145583;font-size:15px;font-weight:700;">Explore {{ $products[0]['name'] }}</a>
                    </td></tr>
                </table>
            </td></tr>
            @endif
            @foreach($posts as $post)
            <tr><td class="inset" style="padding:20px 42px 28px;border-bottom:1px solid #e3e8ed;">
                @if(!empty($post['coverImageUrl']))
                    <a href="{{ $post['canonicalUrl'] }}"><img src="{{ $post['coverImageUrl'] }}" alt="{{ $post['coverImageAlt'] ?? $post['title'] }}" width="636" style="display:block;width:100%;max-width:636px;height:auto;margin:0 0 22px;border:0;"></a>
                @endif
                <p style="margin:0 0 10px;color:#647282;font-size:13px;">{{ $post['publishedAtHuman'] }} &nbsp;·&nbsp; {{ $post['readTimeLabel'] }}</p>
                <h2 class="post-title" style="margin:0 0 12px;color:#17212e;font-size:27px;line-height:1.25;"><a href="{{ $post['canonicalUrl'] }}" style="color:#17212e;text-decoration:none;">{{ $post['title'] }}</a></h2>
                <p style="margin:0 0 16px;color:#34485a;font-size:16px;line-height:1.6;">{{ $post['newsletterExcerpt'] ?? $post['brief'] }}</p>
                <a href="{{ $post['canonicalUrl'] }}" style="color:#145583;font-size:15px;font-weight:700;">Read the post</a>
            </td></tr>
            @if($loop->first && isset($products[1]))
            <tr><td class="inset" style="padding:26px 42px 20px;">
                <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#f5f7f9;border-left:3px solid #8396a9;">
                    <tr><td style="padding:22px 24px;">
                        <p style="margin:0 0 8px;color:#516071;font-size:13px;font-weight:700;">Also building</p>
                        <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 12px;"><tr>
                            @if(!empty($products[1]['logoUrl']))
                            <td width="64" style="width:64px;vertical-align:middle;"><a href="{{ $products[1]['url'] }}"><img src="{{ $products[1]['logoUrl'] }}" alt="{{ $products[1]['name'] }} logo" width="52" height="52" style="display:block;width:52px;height:52px;border:0;border-radius:10px;"></a></td>
                            @endif
                            <td style="vertical-align:middle;"><h2 style="margin:0;font-size:21px;line-height:1.3;"><a href="{{ $products[1]['url'] }}" style="color:#173c5c;text-decoration:none;">{{ $products[1]['name'] }}</a></h2></td>
                        </tr></table>
                        <p style="margin:0 0 12px;color:#34485a;font-size:15px;line-height:1.55;">{{ $products[1]['description'] }}</p>
                        <a href="{{ $products[1]['url'] }}" style="color:#145583;font-size:15px;font-weight:700;">Explore {{ $products[1]['name'] }}</a>
                    </td></tr>
                </table>
            </td></tr>
            @endif
            @endforeach
            @if(!empty($tweets))
            <tr><td class="inset" style="padding:30px 42px 12px;">
                <h2 style="margin:0 0 16px;color:#17212e;font-size:22px;line-height:1.3;">From my X feed</h2>
                @foreach($tweets as $tweet)
                <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 16px;border-top:1px solid #e3e8ed;">
                    <tr><td style="padding:16px 0 0;">
                        <p style="margin:0 0 8px;color:#34485a;font-size:15px;line-height:1.6;">{!! nl2br(e($tweet['text'])) !!}</p>
                        <a href="{{ $tweet['url'] }}" style="color:#145583;font-size:14px;font-weight:700;">View post on X</a>
                    </td></tr>
                </table>
                @endforeach
            </td></tr>
            @else
            <tr><td class="inset" style="padding:28px 42px 10px;">
                <h2 style="margin:0 0 8px;color:#17212e;font-size:22px;line-height:1.3;">More from me on X</h2>
                <p style="margin:0;color:#34485a;font-size:15px;line-height:1.6;">For shorter engineering notes between newsletters, <a href="https://x.com/harundotdev" style="color:#145583;text-decoration:underline;">check out my X feed</a>.</p>
            </td></tr>
            @endif
            <tr><td class="inset" style="padding:30px 42px 32px;color:#516071;font-size:15px;line-height:1.6;">
                Thanks for reading,<br><strong style="color:#17212e;">Harun R.</strong>
            </td></tr>
            <tr><td class="inset" style="padding:26px 42px 18px;background:#eef1f4;border-top:1px solid #dce2e8;">
                <p style="margin:0 0 14px;font-size:14px;line-height:1.5;"><a href="{{ $blogUrl }}" style="color:#173c5c;text-decoration:underline;">Browse the blog</a> &nbsp;·&nbsp; <a href="{{ $unsubscribeUrl }}" style="color:#173c5c;text-decoration:underline;">Unsubscribe</a></p>
                <p style="margin:2px 0 12px;color:#687786;font-size:12px;line-height:1.5;">You’re receiving this because you subscribed at Harun.dev.</p>
                <p style="margin:0;color:#687786;font-size:12px;">© {{ date('Y') }} Harun R. Rayhan. All rights reserved.</p>
            </td></tr>
        </table>
    </td></tr>
</table>
</body>
</html>
