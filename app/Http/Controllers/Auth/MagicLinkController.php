<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Mail\MagicLoginLinkMail;
use App\Models\MagicLoginToken;
use App\Models\User;
use App\Services\Turnstile;
use App\Support\CompleteLogin;
use App\Support\LoginRedirectTarget;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class MagicLinkController extends Controller
{
    public function send(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email:rfc', 'max:255'],
            'cf-turnstile-response' => ['nullable', 'string'],
            'redirect' => ['nullable', 'string', 'max:2048'],
        ]);

        if (! Turnstile::enabled()) {
            throw ValidationException::withMessages(['email' => 'Email sign-in is temporarily unavailable.']);
        }

        if (! Turnstile::verify($data['cf-turnstile-response'] ?? null, $request->ip())) {
            throw ValidationException::withMessages(['email' => 'We could not verify you are human. Please try again.']);
        }

        $email = strtolower($data['email']);

        // Same response whether or not the limit was hit or the account exists.
        if (RateLimiter::attempt('magic-link:'.sha1($email), 3, fn () => true, 600)) {
            $plain = Str::random(48);
            MagicLoginToken::create([
                'email' => $email,
                'token_hash' => hash('sha256', $plain),
                'redirect_to' => LoginRedirectTarget::sanitize($data['redirect'] ?? null),
                'expires_at' => now()->addMinutes(15),
            ]);
            try {
                Mail::to($email)->send(new MagicLoginLinkMail(route('magic-link.show', $plain)));
            } catch (\Throwable $e) {
                // Generic response either way: a mail error must not reveal or 500.
                Log::error('Magic link mail failed', ['exception' => $e]);
            }
        }

        return back()->with('status', 'Check your inbox for a sign-in link. It expires in 15 minutes.');
    }

    public function show(string $token): Response|RedirectResponse
    {
        $row = MagicLoginToken::where('token_hash', hash('sha256', $token))
            ->whereNull('used_at')->where('expires_at', '>', now())->first();

        if (! $row) {
            return $this->invalid();
        }

        return Inertia::render('Auth/MagicLinkConfirm', ['token' => $token, 'email' => $row->email]);
    }

    private function invalid(): RedirectResponse
    {
        return redirect()->route('login')->with('status', 'That sign-in link has expired or was already used. Request a new one.');
    }

    public function consume(Request $request, string $token): RedirectResponse
    {
        [$user, $redirectTo] = DB::transaction(function () use ($token) {
            $row = MagicLoginToken::where('token_hash', hash('sha256', $token))
                ->whereNull('used_at')->where('expires_at', '>', now())
                ->lockForUpdate()->first();

            if (! $row) {
                return [null, null];
            }

            $row->update(['used_at' => now()]);

            $email = strtolower($row->email);
            $user = User::whereRaw('LOWER(email) = ?', [$email])->first();
            $created = $user === null;

            if ($created) {
                $user = new User;
                $user->name = Str::before($email, '@');
                $user->email = $email;
                $user->password = Str::random(64);
                $user->role = 'commenter';
            } elseif ($user->email_verified_at === null) {
                // Defuse pre-registration: whoever set the old password never proved the mailbox.
                $user->password = Str::random(64);
                $user->setRememberToken(Str::random(60));
                // ...and the passkeys and sessions they may have attached meanwhile.
                $user->passkeys()->delete();
                if (config('session.driver') === 'database') {
                    DB::table(config('session.table', 'sessions'))->where('user_id', $user->id)->delete();
                }
            }

            $user->email_verified_at ??= now();

            try {
                // Savepoint so a unique violation does not poison the outer transaction.
                DB::transaction(fn () => $user->save());
            } catch (UniqueConstraintViolationException) {
                $user = User::whereRaw('LOWER(email) = ?', [$email])->firstOrFail();
            }

            return [$user, $row->redirect_to];
        });

        if (! $user) {
            return $this->invalid();
        }

        return CompleteLogin::redirect($request, $user, $redirectTo);
    }
}
