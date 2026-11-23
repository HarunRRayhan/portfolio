            <tr><td class="inset" style="padding:26px 42px 20px;">
                <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#f5f7f9;border-left:3px solid #8396a9;">
                    <tr><td style="padding:22px 24px;">
                        <p style="margin:0 0 8px;color:#516071;font-size:13px;font-weight:700;">Also sponsoring this issue</p>
                        <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 12px;"><tr>
                            @if(!empty($products[1]['logoUrl']))
                            <td width="64" style="width:64px;vertical-align:middle;"><a href="{{ $track($products[1]['url']) }}"><img src="{{ $products[1]['logoUrl'] }}" alt="{{ $products[1]['name'] }} logo" width="52" height="52" style="display:block;width:52px;height:52px;border:0;border-radius:10px;"></a></td>
                            @endif
                            <td style="vertical-align:middle;"><h2 style="margin:0;font-size:21px;line-height:1.3;"><a href="{{ $track($products[1]['url']) }}" style="color:#173c5c;text-decoration:none;">{{ $products[1]['name'] }}</a></h2></td>
                        </tr></table>
                        <p style="margin:0 0 12px;color:#34485a;font-size:15px;line-height:1.55;">{{ $products[1]['description'] }}</p>
                        <a href="{{ $track($products[1]['url']) }}" style="color:#145583;font-size:15px;font-weight:700;">Explore {{ $products[1]['name'] }}</a>
                    </td></tr>
                </table>
            </td></tr>
