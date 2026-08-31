<?php

namespace App\Http\Controllers\Admin\Consultation;

use App\Http\Controllers\Controller;
use App\Services\Consultation\GoogleCalendarService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class GoogleOAuthController extends Controller
{
    public function redirect(GoogleCalendarService $google): RedirectResponse
    {
        return redirect()->away($google->authorizationUrl());
    }

    public function callback(Request $request, GoogleCalendarService $google): RedirectResponse
    {
        if ($request->filled('error')) {
            return redirect()->route('admin.consultations.availability.edit')->with('flash', [
                'type' => 'error',
                'message' => 'Google connection cancelled.',
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
