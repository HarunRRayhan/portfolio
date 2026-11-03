<?php

namespace App\Http\Controllers\Sponsorship;

use App\Http\Controllers\Controller;
use App\Mail\Sponsorship\ScanRequestedMail;
use App\Models\ConsultationCredit;
use App\Services\Sponsorship\SponsorCreditService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;
use Inertia\Response;

class ScanRequestController extends Controller
{
    public function create(Request $request, SponsorCreditService $credits): Response
    {
        $user = $request->user();
        $credits->claimFor($user);
        $credit = $credits->usableCredits($user, ConsultationCredit::KIND_SCAN)->first();

        return Inertia::render('Consultation/ScanRequest', [
            'scanCredit' => $credit ? ['id' => $credit->id, 'expires_at' => $credit->expires_at->toIso8601String()] : null,
            'contactEmail' => config('mail.owner.address'),
            'bookUrl' => route('consultation'),
        ]);
    }

    public function store(Request $request, SponsorCreditService $credits): RedirectResponse
    {
        $user = $request->user();
        $data = $request->validate([
            'repo_url' => ['required', 'string', 'max:2048', 'url:https', fn ($a, $v, $fail) => strtolower((string) parse_url($v, PHP_URL_HOST)) === 'github.com' || $fail('Use a public github.com repo URL.')],
            'notes' => ['nullable', 'string', 'max:5000'],
        ]);

        $credits->claimFor($user);
        $used = DB::transaction(function () use ($user, $data) {
            $credit = ConsultationCredit::query()->usable()
                ->where('user_id', $user->id)->where('kind', ConsultationCredit::KIND_SCAN)
                ->orderBy('expires_at')->orderBy('id')->lockForUpdate()->first();
            if (! $credit) {
                return false;
            }
            $credit->update(['used_at' => now(), 'scan_repo_url' => $data['repo_url']]);

            return true;
        });
        abort_unless($used, 403, 'No scan credit available.');

        try {
            Mail::to(config('mail.owner.address'))->send(new ScanRequestedMail($user->name, $user->email, $data['repo_url'], $data['notes'] ?? null));
        } catch (\Throwable $e) {
            Log::error('Scan request mail failed', ['user_id' => $user->id, 'repo' => $data['repo_url'], 'error' => $e->getMessage()]);
        }

        return redirect()->route('consultation')->with('flash', [
            'type' => 'success',
            'message' => 'Scan requested. I’ll email you the report.',
        ]);
    }
}
