<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Mail\Sponsorship\PaymentRequestMail;
use App\Models\PaymentRequest;
use App\Models\RoadmapAccessGrant;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class RoadmapAccessController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Admin/RoadmapAccess/Index', [
            'grants' => RoadmapAccessGrant::query()->latest()->latest('id')->limit(500)->get()
                ->map(fn (RoadmapAccessGrant $g) => [
                    'id' => $g->id,
                    'email' => $g->email,
                    'note' => $g->note,
                    'expires_at' => $g->expires_at->toIso8601String(),
                    'revoked_at' => $g->revoked_at?->toIso8601String(),
                    'status' => $g->status(),
                ]),
            'requests' => PaymentRequest::query()->latest()->latest('id')->limit(200)->get()
                ->map(fn (PaymentRequest $r) => [
                    'id' => $r->public_id,
                    'name' => $r->name,
                    'email' => $r->email,
                    'country' => $r->country,
                    'plan' => $r->plan,
                    'method' => $r->method,
                    'note' => $r->note,
                    'status' => $r->status,
                    'transaction_id' => $r->transaction_id,
                    'payer_phone' => $r->payer_phone,
                    'created_at' => $r->created_at->toIso8601String(),
                ]),
            'plans' => PaymentRequest::PLANS,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email', 'max:255'],
            'plan' => ['nullable', Rule::in(array_keys(PaymentRequest::PLANS))],
            'expires_at' => ['required_without:plan', 'nullable', 'date', 'after:today'],
            'note' => ['nullable', 'string', 'max:500'],
        ]);
        $email = strtolower($data['email']);

        RoadmapAccessGrant::create([
            'email' => $email,
            'user_id' => User::query()->whereRaw('lower(email) = ?', [$email])->value('id'),
            // The picked date is the last full day of access.
            'expires_at' => ($data['plan'] ?? null) ? PaymentRequest::expiresFor($data['plan']) : Carbon::parse($data['expires_at'])->endOfDay(),
            'note' => $data['note'] ?? null,
            'granted_by' => $request->user()->id,
        ]);

        return back()->with('success', "Roadmap access granted to {$email}.");
    }

    /** Approve a pay-another-way request: grant access for the plan (from today) and tell the person. */
    public function approve(Request $request, string $paymentRequest): RedirectResponse
    {
        $data = $request->validate(['plan' => ['required', Rule::in(array_keys(PaymentRequest::PLANS))]]);
        $r = PaymentRequest::where('public_id', $paymentRequest)->firstOrFail();
        abort_if($r->status === 'approved', 409);

        DB::transaction(function () use ($r, $data, $request) {
            $grant = RoadmapAccessGrant::create([
                'email' => $r->email,
                'user_id' => $r->user_id ?? User::query()->whereRaw('lower(email) = ?', [$r->email])->value('id'),
                'expires_at' => PaymentRequest::expiresFor($data['plan']),
                'note' => trim(PaymentRequest::PLANS[$data['plan']]['label'].' · '.(PaymentRequest::METHODS[$r->method] ?? $r->method).($r->transaction_id ? ' '.$r->transaction_id : '')),
                'granted_by' => $request->user()->id,
            ]);
            $r->update(['plan' => $data['plan'], 'status' => 'approved', 'grant_id' => $grant->id, 'decided_at' => now()]);
        });

        try {
            Mail::to($r->email)->send(new PaymentRequestMail($r->fresh('grant'), 'approved'));
        } catch (\Throwable $e) {
            report($e);
        }

        return back()->with('success', "Approved {$r->email}.");
    }

    public function decline(string $paymentRequest): RedirectResponse
    {
        $r = PaymentRequest::where('public_id', $paymentRequest)->firstOrFail();
        abort_if($r->status === 'approved', 409);
        $r->update(['status' => 'declined', 'decided_at' => now()]);

        return back()->with('success', "Declined {$r->email}.");
    }

    public function revoke(string $grant): RedirectResponse
    {
        // Manual lookup, not route binding: binding runs before role:admin.
        $grant = RoadmapAccessGrant::findOrFail($grant);
        $grant->revoked_at ??= now();
        $grant->save();

        return back()->with('success', "Access revoked for {$grant->email}.");
    }
}
