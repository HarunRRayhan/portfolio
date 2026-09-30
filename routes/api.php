<?php

use App\Http\Controllers\Api\QrCodeController;
use App\Http\Controllers\Api\ShortLinkController;
use App\Http\Middleware\RequireApiAbility;
use Illuminate\Support\Facades\Route;

// Public API for Harun's other projects: create short links and QR codes
// with an admin-issued Sanctum token. auth:sanctum rejects unauthenticated
// requests (401) before throttle:api-key ever runs, so the rate limiter
// only ever sees a real token.
Route::middleware(['auth:sanctum', 'throttle:api-key'])
    ->prefix('v1')
    ->name('api.v1.')
    ->group(function () {
        Route::post('/short-links', [ShortLinkController::class, 'store'])->middleware(RequireApiAbility::class.':short-links:create')->name('short-links.store');
        Route::get('/short-links', [ShortLinkController::class, 'index'])->middleware(RequireApiAbility::class.':short-links:read')->name('short-links.index');
        Route::get('/short-links/{code}', [ShortLinkController::class, 'show'])->middleware(RequireApiAbility::class.':short-links:read')->name('short-links.show');
        Route::patch('/short-links/{code}/deactivate', [ShortLinkController::class, 'deactivate'])->middleware(RequireApiAbility::class.':short-links:manage')->name('short-links.deactivate');
        Route::delete('/short-links/{code}', [ShortLinkController::class, 'destroy'])->middleware(RequireApiAbility::class.':short-links:manage')->name('short-links.destroy');

        Route::post('/qr-codes', [QrCodeController::class, 'store'])->middleware(RequireApiAbility::class.':qr-codes:create')->name('qr-codes.store');
    });
