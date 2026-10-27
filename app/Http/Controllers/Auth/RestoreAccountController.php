<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class RestoreAccountController extends Controller
{
    public function show(Request $request): Response|RedirectResponse
    {
        if (! $request->user()->deletion_scheduled_at) {
            return redirect()->route('agreement.show');
        }

        return Inertia::render('Auth/RestoreAccount', ['purgesOn' => $request->user()->purgesOn()]);
    }

    public function store(Request $request): RedirectResponse
    {
        $request->user()->forceFill(['deletion_scheduled_at' => null])->save();

        // The agreement screen continues straight to the saved target once the Terms are agreed.
        return redirect()->route('agreement.show');
    }
}
