<?php

namespace App\Http\Controllers;

use App\Http\Requests\ContactFormRequest;
use App\Models\ContactSubmission;
use Illuminate\Support\Facades\Mail;
use App\Mail\ContactFormMail;
use Inertia\Inertia;

class ContactController extends Controller
{
    public function submit(ContactFormRequest $request)
    {
        try {
            // Create contact submission
            $submission = ContactSubmission::create([
                'name' => $request->name,
                'email' => $request->email,
                'subject' => $request->subject,
                'message' => $request->message,
                'services' => $request->services,
                'referrer' => $request->referrer,
                'status' => 'pending'
            ]);

            // Send email
            Mail::to(config('mail.to.address'))->send(new ContactFormMail($submission->toArray()));

            // Update status
            $submission->update(['status' => 'sent']);

            return redirect()->back()->with('flash', [
                'type' => 'success',
                'message' => 'Thank you for your message! We will get back to you soon.'
            ]);
        } catch (\Exception $e) {
            report($e);

            return redirect()->back()->with('flash', [
                'type' => 'error',
                'message' => 'Sorry, something went wrong. Please try again later.'
            ]);
        }
    }
}
