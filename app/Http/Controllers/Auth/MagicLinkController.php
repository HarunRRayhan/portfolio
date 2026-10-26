<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Mail\MagicLoginLinkMail;
use App\Models\MagicLoginToken;
use App\Models\User;
use App\Services\Turnstile;
use App\Support\CompleteLogin;
use App\Support\LoginRedirectTarget;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class MagicLinkController extends Controller
{
    public function send(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email:rfc', 'max:255'],
            'cf-turnstile-response' => ['nullable', 'string'],
            'redirect' => ['nullable', 'string'],
        ]);

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
            Mail::to($email)->queue(new MagicLoginLinkMail(route('magic-link.consume', $plain)));
        }

        return back()->with('status', 'Check your inbox for a sign-in link. It expires in 15 minutes.');
    }

    public function consume(Request $request, string $token): RedirectResponse
    {
        [$user, $created, $redirectTo] = DB::transaction(function () use ($token) {
            $row = MagicLoginToken::where('token_hash', hash('sha256', $token))
                ->whereNull('used_at')->where('expires_at', '>', now())
                ->lockForUpdate()->first();

            if (! $row) {
                return [null, false, null];
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
            }

            $user->email_verified_at ??= now();
            $user->save();

            return [$user, $created, $row->redirect_to];
        });

        if (! $user) {
            return redirect()->route('login')->with('status', 'That sign-in link has expired or was already used. Request a new one.');
        }

        return CompleteLogin::redirect($request, $user, $created, $redirectTo);
    }
}
