<?php

namespace App\Http\Controllers\Sponsorship;

use App\Http\Controllers\Controller;
use App\Mail\Sponsorship\PaymentRequestMail;
use App\Models\PaymentRequest;
use App\Services\CountryResolver;
use App\Services\Turnstile;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\URL;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

/** "GitHub Sponsors doesn't work for me": ask to pay another way, then come back with the payment details. */
class PaymentRequestController extends Controller
{
    public function create(Request $request, CountryResolver $countries): Response
    {
        $user = $request->user();

        return Inertia::render('Sponsor/Pay', [
            'prefill' => ['name' => (string) $user?->name, 'email' => (string) $user?->email, 'country' => $countries->resolve($request) ?? ''],
            'plans' => PaymentRequest::PLANS,
            'mine' => $user ? PaymentRequest::where('user_id', $user->id)->latest()->get()->map(fn (PaymentRequest $r) => $this->summary($r))->all() : [],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        // shortcut: skipped when no Turnstile secret is configured (local/tests); production has one.
        if (Turnstile::enabled() && ! Turnstile::verify($request->input('cf-turnstile-response'), $request->ip())) {
            throw ValidationException::withMessages(['cf-turnstile-response' => 'We could not verify you are human. Please try again.']);
        }
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email:filter', 'max:255'],
            'country' => ['required', 'string', 'regex:/^[A-Z]{2}$/'],
            'plan' => ['required', Rule::in(array_keys(PaymentRequest::PLANS))],
            'method' => ['required', Rule::in(array_keys(PaymentRequest::METHODS))],
            'note' => ['nullable', 'string', 'max:2000'],
        ]);
        if ($data['method'] === 'bkash' && $data['country'] !== 'BD') {
            throw ValidationException::withMessages(['method' => 'bKash is only for Bangladesh.']);
        }

        $paymentRequest = PaymentRequest::create(['email' => strtolower($data['email']), 'user_id' => $request->user()?->id] + $data);
        $this->mail($paymentRequest, $paymentRequest->email, 'received');
        $this->mail($paymentRequest, config('mail.owner.address'), 'owner');

        return redirect($paymentRequest->url());
    }

    public function show(Request $request, PaymentRequest $paymentRequest): Response
    {
        $this->authorizeLink($request, $paymentRequest);

        return Inertia::render('Sponsor/PayRequest', [
            'request' => $this->summary($paymentRequest),
            'paidUrl' => URL::signedRoute('sponsor.pay.paid', ['paymentRequest' => $paymentRequest->public_id]),
            'seo' => ['title' => 'Your sponsorship request | Harun R. Rayhan', 'description' => '', 'canonicalUrl' => url('/sponsor-me/pay'), 'noindex' => true],
        ]);
    }

    public function paid(Request $request, PaymentRequest $paymentRequest): RedirectResponse
    {
        $this->authorizeLink($request, $paymentRequest);
        abort_if(in_array($paymentRequest->status, ['approved', 'declined'], true), 409);
        $data = $request->validate([
            'transaction_id' => ['required', 'string', 'max:64', 'regex:/^[A-Za-z0-9-]+$/'],
            'payer_phone' => ['required', 'string', 'max:32', 'regex:/^\+?[0-9 -]{6,20}$/'],
        ]);
        $paymentRequest->update($data + ['status' => 'paid', 'paid_at' => now()]);
        $this->mail($paymentRequest, config('mail.owner.address'), 'owner');

        return back()->with('flash', ['type' => 'success', 'message' => 'Thanks. I will check the payment and unlock your access.']);
    }

    /** The signed link from the email, or the signed-in account that made the request. */
    private function authorizeLink(Request $request, PaymentRequest $paymentRequest): void
    {
        $owner = $request->user() && $paymentRequest->user_id === $request->user()->id;
        abort_unless($owner || $request->hasValidSignature(), 403);
    }

    private function summary(PaymentRequest $r): array
    {
        return [
            'id' => $r->public_id,
            'plan' => $r->plan,
            'method' => $r->method,
            'country' => $r->country,
            'status' => $r->status,
            'transactionId' => $r->transaction_id,
            'createdAt' => $r->created_at?->toIso8601String(),
            'url' => $r->url(),
        ];
    }

    /** Mail failures are reported, not shown: the request is saved and the admin list still has it. */
    private function mail(PaymentRequest $r, ?string $to, string $kind): void
    {
        if (! $to) {
            return;
        }
        try {
            Mail::to($to)->send(new PaymentRequestMail($r, $kind));
        } catch (\Throwable $e) {
            report($e);
        }
    }
}
