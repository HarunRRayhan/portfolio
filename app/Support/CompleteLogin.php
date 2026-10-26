<?php

namespace App\Support;

use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CompleteLogin
{
    public static function redirect(Request $request, User $user, bool $created, ?string $redirectTo): RedirectResponse
    {
        Auth::login($user, true);
        $request->session()->regenerate();

        $intended = $request->session()->pull('url.intended');
        $target = LoginRedirectTarget::sanitize($redirectTo)
            ?? LoginRedirectTarget::sanitize($intended)
            ?? route($user->isAdmin() ? 'dashboard' : 'blog.index', absolute: false);

        if ($created) {
            $request->session()->put('passkey_prompt.redirect_to', $target);

            return redirect()->route('passkeys.prompt');
        }

        return redirect()->to($target);
    }
}
