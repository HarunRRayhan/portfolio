<?php

namespace App\Http\Controllers;

use App\Http\Requests\ContactFormRequest;
use App\Mail\ContactFormMail;
use App\Models\ContactSubmission;
use Illuminate\Support\Facades\Mail;

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
                'status' => 'pending',
            ]);

            // Send email
            Mail::to(config('mail.owner.address'), config('mail.owner.name'))->send(new ContactFormMail($submission->toArray()));

            // Update status
            $submission->update(['status' => 'sent']);

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
