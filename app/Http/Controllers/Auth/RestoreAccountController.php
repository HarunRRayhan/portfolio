<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class RestoreAccountController extends Controller
{
    /** Set by CompleteLogin. Sessions from before the deletion (other devices) must sign in again to restore. */
    public const FRESH_LOGIN_KEY = 'account.restore_fresh_login';

    public function show(Request $request): Response|RedirectResponse
    {
        if (! $request->user()->deletion_scheduled_at) {
            return redirect()->route('agreement.show');
        }

        if (! $request->session()->get(self::FRESH_LOGIN_KEY)) {
            return $this->signInAgain($request);
        }

        return Inertia::render('Auth/RestoreAccount', ['purgesOn' => $request->user()->purgesOn()]);
    }

    public function store(Request $request): RedirectResponse
    {
        if (! $request->session()->pull(self::FRESH_LOGIN_KEY)) {
            return $this->signInAgain($request);
        }

        $request->user()->forceFill(['deletion_scheduled_at' => null])->save();

        // The agreement screen continues straight to the saved target once the Terms are agreed.
        return redirect()->route('agreement.show');
    }

    private function signInAgain(Request $request): RedirectResponse
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('login')->with('status', 'Sign in again to restore your account.');
    }
}
