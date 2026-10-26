<?php

use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Auth\EmailVerificationNotificationController;
use App\Http\Controllers\Auth\EmailVerificationPromptController;
use App\Http\Controllers\Auth\MagicLinkController;
use App\Http\Controllers\Auth\PasskeyController;
use App\Http\Controllers\Auth\SocialAuthenticationController;
use App\Http\Controllers\Auth\VerifyEmailController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::middleware('guest')->group(function () {
    Route::get('register', fn (Request $request) => redirect('/login'.($request->getQueryString() ? '?'.$request->getQueryString() : ''), 301));

    Route::get('login', [AuthenticatedSessionController::class, 'create'])
        ->name('login');

    Route::post('login/magic-link', [MagicLinkController::class, 'send'])
        ->middleware('throttle:5,1,magic-link')
        ->name('magic-link.send');

    Route::get('login/magic/{token}', [MagicLinkController::class, 'show'])
        ->name('magic-link.show');

    Route::post('login/magic/{token}', [MagicLinkController::class, 'consume'])
        ->middleware('throttle:10,1,magic-consume')
        ->name('magic-link.consume');

    Route::get('passkeys/login-options', [PasskeyController::class, 'loginOptions'])
        ->middleware('throttle:20,1,passkey-options')
        ->name('passkeys.login-options');

    Route::post('passkeys/login', [PasskeyController::class, 'login'])
        ->middleware('throttle:10,1,passkey-login')
        ->name('passkeys.login');

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

    Route::get('passkeys/prompt', [PasskeyController::class, 'prompt'])->name('passkeys.prompt');
    Route::post('passkeys/prompt/skip', [PasskeyController::class, 'skip'])->name('passkeys.skip');
    Route::get('passkeys/register-options', [PasskeyController::class, 'registerOptions'])
        ->middleware(['verified', 'throttle:20,1,passkey-register-options'])
        ->name('passkeys.register-options');
    Route::post('passkeys', [PasskeyController::class, 'store'])
        ->middleware(['verified', 'throttle:10,1,passkey-store'])
        ->name('passkeys.store');
    Route::delete('passkeys/{passkey}', [PasskeyController::class, 'destroy'])->name('passkeys.destroy');

    Route::post('logout', [AuthenticatedSessionController::class, 'destroy'])
        ->name('logout');
});
