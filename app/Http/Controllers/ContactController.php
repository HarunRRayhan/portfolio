<?php

namespace App\Http\Controllers;

use App\Http\Requests\ContactFormRequest;
use App\Mail\ContactFormMail;
use App\Models\ContactSubmission;
use App\Models\Subscriber;
use App\Services\Turnstile;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\ValidationException;

class ContactController extends Controller
{
    public function submit(ContactFormRequest $request)
    {
        // shortcut: skipped when no Turnstile secret is configured (local/tests); production has one.
        if (Turnstile::enabled() && ! Turnstile::verify($request->input('cf-turnstile-response'), $request->ip())) {
            throw ValidationException::withMessages(['cf-turnstile-response' => 'We could not verify you are human. Please try again.']);
        }

        try {
            // Create contact submission
            $submission = ContactSubmission::create([
                'name' => $request->name,
                'email' => $request->email,
                'subject' => $request->subject,
                'message' => $request->message,
                'services' => $request->services,
                'referrer' => $request->referrer,
                'status' => 'pending',
            ]);

            // Send email
            Mail::to(config('mail.owner.address'), config('mail.owner.name'))->send(new ContactFormMail($submission->toArray()));

            // Update status
            $submission->update(['status' => 'sent']);

            // Opt-in box is pre-ticked. Never resubscribe someone who already unsubscribed.
            if ($request->boolean('subscribe')) {
                $subscriber = Subscriber::firstOrCreate(
                    ['email' => $request->email],
                    ['source' => 'contact_form', 'referrer' => $request->referrer, 'status' => 'subscribed'],
                );
                if ($subscriber->wasRecentlyCreated) {
                    Cache::forget('newsletter.subscriber_count');
                }
            }

            return redirect()->back()->with('flash', [
                'type' => 'success',
                'message' => 'Thanks. I read these and reply myself.',
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
