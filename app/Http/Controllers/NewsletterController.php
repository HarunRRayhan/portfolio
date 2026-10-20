<?php

namespace App\Http\Controllers;

use App\Http\Requests\SubscribeRequest;
use App\Models\NewsletterClick;
use App\Models\NewsletterDelivery;
use App\Models\Subscriber;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class NewsletterController extends Controller
{
    public function subscribe(SubscribeRequest $request)
    {
        try {
            $subscriber = Subscriber::firstOrNew(['email' => $request->email]);

            if (! $subscriber->exists) {
                $subscriber->source = $request->source;
                $subscriber->referrer = $request->referrer;
            }

            // A reader who subscribes again after using the unsubscribe link
            // should be opted back in without losing the original attribution.
            $subscriber->status = 'subscribed';
            $subscriber->save();
            Cache::forget('newsletter.subscriber_count');

            return redirect()->back()->with('flash', [
                'type' => 'success',
                'message' => "You're subscribed. New tools and posts will land in your inbox.",
            ]);
        } catch (\Exception $e) {
            report($e);

            return redirect()->back()->with('flash', [
                'type' => 'error',
                'message' => 'Sorry, something went wrong. Please try again later.',
            ]);
        }
    }

    public function unsubscribe(Subscriber $subscriber)
    {
        $subscriber->update(['status' => 'unsubscribed']);
        Cache::forget('newsletter.subscriber_count');

        return response()->view('newsletter.unsubscribed');
    }

    /** 1x1 transparent GIF that marks the delivery as opened. */
    public function open(string $delivery)
    {
        NewsletterDelivery::query()->whereKey($delivery)->whereNull('opened_at')->update(['opened_at' => now()]);

        return response(base64_decode('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'), 200, [
            'Content-Type' => 'image/gif',
            'Cache-Control' => 'no-store, private',
        ]);
    }

    /** Records the click, then forwards to the signed destination. A click also counts as an open. */
    public function click(Request $request, string $delivery)
    {
        $url = (string) $request->query('url');
        abort_unless(preg_match('#^https?://#i', $url), 404);

        // Look up by id (not route binding) so a deleted subscriber's old email still forwards.
        $record = NewsletterDelivery::query()->find($delivery);

        if ($record) {
            NewsletterClick::create(['newsletter_delivery_id' => $record->id, 'url' => mb_substr($url, 0, 2048)]);
            $record->opened_at ?? $record->update(['opened_at' => now()]);
        }

        return redirect()->away($url);
    }
}
