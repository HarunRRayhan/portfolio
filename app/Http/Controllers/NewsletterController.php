<?php

namespace App\Http\Controllers;

use App\Http\Requests\SubscribeRequest;
use App\Models\NewsletterClick;
use App\Models\NewsletterDelivery;
use App\Models\Subscriber;
use App\Services\Turnstile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Validation\ValidationException;

class NewsletterController extends Controller
{
    public function subscribe(SubscribeRequest $request)
    {
        // shortcut: skipped when no Turnstile secret is configured (local/tests); production has one.
        if (Turnstile::enabled() && ! Turnstile::verify($request->input('cf-turnstile-response'), $request->ip())) {
            throw ValidationException::withMessages(['cf-turnstile-response' => 'We could not verify you are human. Please try again.']);
        }

        try {
            // Same reply whether or not a mail went out, so the form can't be used to probe addresses.
            Subscriber::requestConfirmation($request->email, $request->source, $request->referrer);

            return redirect()->back()->with('flash', [
                'type' => 'success',
                'message' => 'Check your inbox to confirm your subscription.',
            ]);
        } catch (\Exception $e) {
            report($e);

            return redirect()->back()->with('flash', [
                'type' => 'error',
                'message' => 'Sorry, something went wrong. Please try again later.',
            ]);
        }
    }

    public function confirm(Subscriber $subscriber)
    {
        $subscriber->update(['status' => 'subscribed']);
        Cache::forget('newsletter.subscriber_count');

        return redirect('/blog')->with('flash', [
            'type' => 'success',
            'message' => "You're subscribed. New tools and posts will land in your inbox.",
        ]);
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
