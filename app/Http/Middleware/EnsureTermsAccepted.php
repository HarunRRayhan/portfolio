<?php

namespace App\Http\Middleware;

use App\Http\Controllers\Auth\AgreementController;
use App\Support\LoginRedirectTarget;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Gates routes that need an account. A signed-in user whose account is scheduled for deletion
 * goes to the restore screen; one who hasn't agreed to the Terms goes to the agreement screen.
 * Public pages stay open.
 */
class EnsureTermsAccepted
{
    private const RESTORE_ROUTES = ['account.restore', 'account.restore.store', 'logout'];

    private const AGREEMENT_ROUTES = [
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

        [$gate, $allowed, $message] = match (true) {
            ! $user => [null, [], null],
            (bool) $user->deletion_scheduled_at => ['account.restore', self::RESTORE_ROUTES, 'This account is scheduled for deletion.'],
            ! $user->terms_accepted_at => ['agreement.show', self::AGREEMENT_ROUTES, 'Please agree to the Terms and Privacy Policy first.'],
            default => [null, [], null],
        };

        if (! $gate || $request->routeIs(...$allowed) || ! $this->needsAccount($request)) {
            return $next($request);
        }

        if ($request->expectsJson() && ! $request->header('X-Inertia')) {
            abort(403, $message);
        }

        if ($request->isMethod('GET') && ($target = LoginRedirectTarget::sanitize($request->getRequestUri()))) {
            $request->session()->put(AgreementController::REDIRECT_KEY, $target);
        }

        return redirect()->route($gate);
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
