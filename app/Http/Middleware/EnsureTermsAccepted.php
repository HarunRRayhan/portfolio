<?php

namespace App\Http\Middleware;

use App\Http\Controllers\Auth\AgreementController;
use App\Support\LoginRedirectTarget;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Sends signed-in users who haven't agreed to the Terms to the agreement screen,
 * but only on routes that need an account. Public pages stay open.
 */
class EnsureTermsAccepted
{
    private const ALLOWED_ROUTES = [
        'agreement.show',
        'agreement.accept',
        'passkeys.register-options',
        'passkeys.store',
        'passkeys.update',
        'logout',
    ];

    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user || $user->terms_accepted_at || $request->routeIs(...self::ALLOWED_ROUTES) || ! $this->needsAccount($request)) {
            return $next($request);
        }

        if ($request->expectsJson() && ! $request->header('X-Inertia')) {
            abort(403, 'Please agree to the Terms and Privacy Policy first.');
        }

        if ($request->isMethod('GET') && ($target = LoginRedirectTarget::sanitize($request->getRequestUri()))) {
            $request->session()->put(AgreementController::REDIRECT_KEY, $target);
        }

        return redirect()->route('agreement.show');
    }

    private function needsAccount(Request $request): bool
    {
        foreach ($request->route()?->gatherMiddleware() ?? [] as $middleware) {
            if (is_string($middleware) && ($middleware === 'auth' || str_starts_with($middleware, 'auth:'))) {
                return true;
            }
        }

        return false;
    }
}
