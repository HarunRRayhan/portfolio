<?php

namespace App\Http\Controllers;

use App\Http\Requests\SubscribeRequest;
use App\Models\Subscriber;
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
}
