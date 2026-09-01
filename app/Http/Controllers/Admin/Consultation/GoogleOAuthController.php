<?php

namespace App\Http\Controllers\Admin\Consultation;

use App\Http\Controllers\Controller;
use App\Services\Consultation\GoogleCalendarService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class GoogleOAuthController extends Controller
{
    public function redirect(Request $request, GoogleCalendarService $google): RedirectResponse
    {
        $state = Str::random(40);
        $request->session()->put('consultation_google_oauth_state', $state);

        return redirect()->away($google->authorizationUrl($state));
    }

    public function callback(Request $request, GoogleCalendarService $google): RedirectResponse
    {
        if ($request->filled('error')) {
            return redirect()->route('admin.consultations.availability.edit')->with('flash', [
                'type' => 'error',
                'message' => 'Google connection cancelled.',
            ]);
        }

        $expectedState = (string) $request->session()->pull('consultation_google_oauth_state', '');
        $providedState = $request->string('state')->toString();

        if ($expectedState === '' || $providedState === '' || ! hash_equals($expectedState, $providedState)) {
            return redirect()->route('admin.consultations.availability.edit')->with('flash', [
                'type' => 'error',
                'message' => 'Invalid Google auth state. Please try connecting again.',
            ]);
        }

        $code = $request->string('code')->toString();

        if ($code === '') {
            return redirect()->route('admin.consultations.availability.edit')->with('flash', [
                'type' => 'error',
                'message' => 'Missing Google auth code.',
            ]);
        }

        try {
            $google->handleCallback($code);
        } catch (\Throwable $e) {
            return redirect()->route('admin.consultations.availability.edit')->with('flash', [
                'type' => 'error',
                'message' => 'Google connect failed: '.$e->getMessage(),
            ]);
        }

        return redirect()->route('admin.consultations.availability.edit')->with('flash', [
            'type' => 'success',
            'message' => 'Google Calendar connected.',
        ]);
    }

    public function disconnect(GoogleCalendarService $google): RedirectResponse
    {
        $google->disconnect();

        return back()->with('flash', [
            'type' => 'success',
            'message' => 'Google Calendar disconnected.',
        ]);
    }
}
