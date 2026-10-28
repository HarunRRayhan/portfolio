<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ContactSubmission;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ContactSubmissionController extends Controller
{
    /** 'pending' = owner mail failed, 'sent' = new and unhandled. */
    public const STATUSES = ['pending', 'sent', 'replied', 'archived', 'spam'];

    public function index(): Response
    {
        return Inertia::render('Admin/Contacts/Index', [
            'submissions' => ContactSubmission::query()
                ->orderByDesc('created_at')
                ->orderByDesc('id')
                ->paginate(25)
                ->through(fn (ContactSubmission $s) => [
                    'id' => $s->id,
                    'name' => $s->name,
                    'email' => $s->email,
                    'subject' => $s->subject,
                    'message' => $s->message,
                    'referrer' => $s->referrer,
                    'status' => $s->status,
                    'created_at' => $s->created_at?->toIso8601String(),
                ]),
            'statuses' => self::STATUSES,
        ]);
    }

    // Manual lookup, not route binding: binding would run before role:admin (see NewsletterController::reveal).
    public function update(Request $request, string $submission): RedirectResponse
    {
        ContactSubmission::findOrFail($submission)->update($request->validate(['status' => ['required', Rule::in(self::STATUSES)]]));

        return back();
    }

    public function destroy(string $submission): RedirectResponse
    {
        ContactSubmission::findOrFail($submission)->delete();

        return back();
    }
}
