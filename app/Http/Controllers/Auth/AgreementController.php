<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Subscriber;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AgreementController extends Controller
{
    public const REDIRECT_KEY = 'agreement.redirect_to';

    public function show(Request $request): Response|RedirectResponse
    {
        if ($request->user()->terms_accepted_at) {
            return $this->continue($request);
        }

        return Inertia::render('Auth/Welcome', [
            'hasPasskey' => $request->user()->passkeys()->exists(),
        ]);
    }

    public function accept(Request $request): RedirectResponse
    {
        $request->validate(['terms' => ['accepted']], ['terms.accepted' => 'Please agree to the Terms and Privacy Policy to continue.']);

        $user = $request->user();
        $user->forceFill(['terms_accepted_at' => now()])->save();

        // Sign-in already proved the address, so no confirm mail: subscribe straight away.
        if ($request->boolean('newsletter') && $user->email_verified_at && $user->email) {
            $email = strtolower($user->email);
            $subscriber = Subscriber::whereRaw('lower(email) = ?', [$email])->first()
                ?? new Subscriber(['email' => $email, 'source' => 'signup']);
            $subscriber->status = 'subscribed';
            $subscriber->save();
        }

        return $this->continue($request);
    }

    private function continue(Request $request): RedirectResponse
    {
        return redirect()->to(
            $request->session()->pull(self::REDIRECT_KEY)
                ?? route($request->user()->isAdmin() ? 'dashboard' : 'blog.index', absolute: false)
        );
    }
}
