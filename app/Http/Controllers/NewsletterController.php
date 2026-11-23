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
            // Honeypot: people never see the `website` field, bots fill it. Same reply, nothing stored or mailed.
            if (filled($request->input('website'))) {
                return redirect()->back()->with('flash', ['type' => 'success', 'message' => 'Check your inbox to confirm your subscription.', 'askName' => true]);
            }

            // A signed-in, verified member subscribing their own address already proved ownership: no confirm mail.
            // A guest typing a member's address still confirms, since the form can't tell who is typing.
            $user = $request->user();
            if ($user?->email_verified_at && strcasecmp(trim((string) $user->email), trim($request->email)) === 0) {
                Subscriber::subscribeVerified($user->email, $request->source ?? 'account');
                // Members already have a name on their account, so no name step.
                Cache::forget('newsletter.subscriber_count');

                return redirect()->back()->with('flash', ['type' => 'success', 'message' => "You're subscribed. The next issue lands in your inbox."]);
            }

            $email = strtolower(trim($request->email));
            $existed = Subscriber::whereRaw('lower(email) = ?', [$email])->exists();

            // Same reply whether or not a mail went out, so the form can't be used to probe addresses.
            Subscriber::requestConfirmation($request->email, $request->source, $request->referrer);

            // The name step may only touch a row this request just created. An address that was already on the
            // list (anyone can type anyone's email) keeps its name, so a stranger can't rename someone's subscription.
            $created = $existed ? null : Subscriber::whereRaw('lower(email) = ?', [$email])->value('id');
            $request->session()->put(self::NAME_KEY, $created);

            return redirect()->back()->with('flash', [
                'type' => 'success',
                'message' => 'Check your inbox to confirm your subscription.',
                'askName' => true,
            ]);
        } catch (\Exception $e) {
            report($e);

            return redirect()->back()->with('flash', [
                'type' => 'error',
                'message' => 'Sorry, something went wrong. Please try again later.',
            ]);
        }
    }

    private const NAME_KEY = 'newsletter.name_for';

    /** Optional step after subscribing: "What should we call you?". Empty clears nothing and is fine. */
    public function name(Request $request)
    {
        $name = trim((string) $request->validate(['name' => ['nullable', 'string', 'max:80']])['name']);
        $id = $request->session()->pull(self::NAME_KEY);

        if ($id && $name !== '') {
            Subscriber::whereKey($id)->where('status', 'pending')->whereNull('name')->update(['name' => $name]);
        }

        return redirect()->back();
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
