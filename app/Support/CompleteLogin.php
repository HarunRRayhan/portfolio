<?php

namespace App\Support;

use App\Http\Controllers\Auth\AgreementController;
use App\Http\Controllers\Auth\RestoreAccountController;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CompleteLogin
{
    public static function redirect(Request $request, User $user, ?string $redirectTo): RedirectResponse
    {
        Auth::login($user, true);
        $request->session()->regenerate();

        $intended = $request->session()->pull('url.intended');
        $target = LoginRedirectTarget::sanitize($redirectTo)
            ?? LoginRedirectTarget::sanitize($intended)
            ?? route($user->isAdmin() ? 'dashboard' : 'blog.index', absolute: false);

        if ($user->deletion_scheduled_at) {
            $request->session()->put(AgreementController::REDIRECT_KEY, $target);
            $request->session()->put(RestoreAccountController::FRESH_LOGIN_KEY, $user->deletion_scheduled_at->toIso8601String());

            return redirect()->route('account.restore');
        }

        // New accounts, and existing ones from before the agreement, see the Terms + passkey screen once.
        if (! $user->terms_accepted_at) {
            $request->session()->put(AgreementController::REDIRECT_KEY, $target);

            return redirect()->route('agreement.show');
        }

        return redirect()->to($target);
    }
}
