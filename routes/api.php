<?php

use App\Http\Controllers\Api\QrCodeController;
use App\Http\Controllers\Api\ShortLinkController;
use Illuminate\Support\Facades\Route;

// Public API for Harun's other projects: create short links and QR codes
// with an admin-issued Sanctum token. auth:sanctum rejects unauthenticated
// requests (401) before throttle:api-key ever runs, so the rate limiter
// only ever sees a real token.
Route::middleware(['auth:sanctum', 'throttle:api-key'])
    ->prefix('v1')
    ->name('api.v1.')
    ->group(function () {
        Route::post('/short-links', [ShortLinkController::class, 'store'])->name('short-links.store');
        Route::get('/short-links', [ShortLinkController::class, 'index'])->name('short-links.index');
        Route::get('/short-links/{code}', [ShortLinkController::class, 'show'])->name('short-links.show');
        Route::patch('/short-links/{code}/deactivate', [ShortLinkController::class, 'deactivate'])->name('short-links.deactivate');
        Route::delete('/short-links/{code}', [ShortLinkController::class, 'destroy'])->name('short-links.destroy');

        Route::post('/qr-codes', [QrCodeController::class, 'store'])->name('qr-codes.store');
    });
