<?php

namespace App\Http\Controllers;

use App\Http\Requests\SubscribeRequest;
use App\Models\Subscriber;

class NewsletterController extends Controller
{
    public function subscribe(SubscribeRequest $request)
    {
        try {
            Subscriber::firstOrCreate(
                ['email' => $request->email],
                [
                    'source' => $request->source,
                    'referrer' => $request->referrer,
                    'status' => 'subscribed',
                ]
            );

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
}
