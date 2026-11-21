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

    public const NEWSLETTER_OFFER_KEY = 'newsletter.offer_after_signup';

    public function show(Request $request): Response|RedirectResponse
    {
        if ($request->user()->terms_accepted_at) {
            return $this->continue($request);
        }

        return Inertia::render('Auth/Welcome', [
            'hasPasskey' => $request->user()->passkeys()->exists(),
            'subscribed' => (bool) ($request->user()->email && Subscriber::isSubscribed($request->user()->email)),
        ]);
    }

    public function accept(Request $request): RedirectResponse
    {
        $request->validate(['terms' => ['accepted']], ['terms.accepted' => 'Please agree to the Terms and Privacy Policy to continue.']);

        $user = $request->user();
        $user->forceFill(['terms_accepted_at' => now()])->save();

        // The unticked newsletter box on this screen is the sign-up offer; no follow-up popup either way.
        if ($request->boolean('newsletter') && $user->email_verified_at && $user->email) {
            Subscriber::subscribeVerified($user->email, 'welcome');
        }

        return $this->continue($request);
    }

    /** One-click subscribe from the after-sign-up offer. */
    public function subscribe(Request $request): RedirectResponse
    {
        $user = $request->user();
        if ($user->email_verified_at && $user->email) {
            Subscriber::subscribeVerified($user->email, 'signup-offer');
        }

        return back();
    }

    private function continue(Request $request): RedirectResponse
    {
        return redirect()->to(
            $request->session()->pull(self::REDIRECT_KEY)
                ?? route($request->user()->isAdmin() ? 'dashboard' : 'blog.index', absolute: false)
        );
    }
}
