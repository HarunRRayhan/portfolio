<?php

use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Auth\EmailVerificationNotificationController;
use App\Http\Controllers\Auth\EmailVerificationPromptController;
use App\Http\Controllers\Auth\MagicLinkController;
use App\Http\Controllers\Auth\SocialAuthenticationController;
use App\Http\Controllers\Auth\VerifyEmailController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::middleware('guest')->group(function () {
    Route::get('register', fn (Request $request) => redirect('/login'.($request->getQueryString() ? '?'.$request->getQueryString() : ''), 301));

    Route::get('login', [AuthenticatedSessionController::class, 'create'])
        ->name('login');

    Route::post('login/magic-link', [MagicLinkController::class, 'send'])
        ->middleware('throttle:5,1')
        ->name('magic-link.send');

    Route::get('login/magic/{token}', [MagicLinkController::class, 'show'])
        ->name('magic-link.show');

    Route::post('login/magic/{token}', [MagicLinkController::class, 'consume'])
        ->middleware('throttle:10,1')
        ->name('magic-link.consume');

    Route::get('auth/{provider}', [SocialAuthenticationController::class, 'redirect'])
        ->whereIn('provider', ['github', 'google'])
        ->name('social.redirect');

    Route::get('auth/{provider}/callback', [SocialAuthenticationController::class, 'callback'])
        ->whereIn('provider', ['github', 'google'])
        ->name('social.callback');
});

Route::middleware('auth')->group(function () {
    Route::get('verify-email', EmailVerificationPromptController::class)
        ->name('verification.notice');

    Route::get('verify-email/{id}/{hash}', VerifyEmailController::class)
        ->middleware(['signed', 'throttle:6,1'])
        ->name('verification.verify');

    Route::post('email/verification-notification', [EmailVerificationNotificationController::class, 'store'])
        ->middleware('throttle:6,1')
        ->name('verification.send');

    // Temporary until the passkey prompt page lands.
    Route::get('passkeys/prompt', fn (Request $request) => redirect()->to(
        $request->session()->pull('passkey_prompt.redirect_to') ?? route('blog.index', absolute: false)
    ))->name('passkeys.prompt');

    Route::post('logout', [AuthenticatedSessionController::class, 'destroy'])
        ->name('logout');
});
