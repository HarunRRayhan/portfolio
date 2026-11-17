<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Your roadmap progress</title></head>
<body style="margin:0;padding:0;background:#f3f5f7;color:#17212e;font-family:Arial,Helvetica,sans-serif;">
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#f3f5f7;">
    <tr><td align="center" style="padding:28px 12px;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="width:600px;max-width:100%;background:#ffffff;border:1px solid #dce2e8;">
            <tr><td style="padding:34px 36px 12px;">
                <h1 style="margin:0 0 10px;font-size:26px;line-height:1.25;">Hi {{ $name }},</h1>
                <p style="margin:0;color:#516071;font-size:16px;line-height:1.6;">
                    @if($d['idle'])
                        You have not finished a lesson this week. Pick up where you stopped, one lesson is enough.
                    @else
                        This week you finished {{ $d['lessonsWeek'] }} lesson{{ $d['lessonsWeek'] === 1 ? '' : 's' }} and earned {{ $d['xpWeek'] }} XP. You have {{ $d['xpTotal'] }} XP in total.
                    @endif
                </p>
            </td></tr>
            @foreach($d['roadmaps'] as $r)
            <tr><td style="padding:14px 36px;">
                <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#f5f7f9;border-left:3px solid #28679a;">
                    <tr><td style="padding:18px 20px;">
                        <h2 style="margin:0 0 6px;font-size:19px;"><a href="{{ $r['url'] }}" style="color:#173c5c;text-decoration:none;">{{ $r['title'] }}</a></h2>
                        <p style="margin:0 0 10px;color:#516071;font-size:14px;">{{ $r['done'] }} of {{ $r['total'] }} lessons, {{ $r['percent'] }}%</p>
                        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 12px;"><tr>
                            <td width="{{ max($r['percent'], 2) }}%" style="background:#f59e0b;height:6px;font-size:0;line-height:0;">&nbsp;</td>
                            <td style="background:#dce2e8;height:6px;font-size:0;line-height:0;">&nbsp;</td>
                        </tr></table>
                        <p style="margin:0;font-size:15px;">Next: <a href="{{ $r['next']['url'] }}" style="color:#145583;font-weight:700;">{{ $r['next']['title'] }}</a></p>
                    </td></tr>
                </table>
            </td></tr>
            @endforeach
            <tr><td style="padding:14px 36px 6px;"><a href="{{ $leaderboardUrl }}" style="color:#145583;font-size:15px;font-weight:700;">See the leaderboard</a></td></tr>
            <tr><td style="padding:18px 36px 30px;color:#647282;font-size:12px;line-height:1.5;">
                You get this because you subscribed to the Harun.dev newsletter and follow a roadmap. <a href="{{ $unsubscribeUrl }}" style="color:#647282;">Unsubscribe</a> from all emails.
            </td></tr>
        </table>
    </td></tr>
</table>
</body>
</html>
