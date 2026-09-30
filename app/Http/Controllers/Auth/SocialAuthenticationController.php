<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Support\LoginRedirectTarget;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class SocialAuthenticationController extends Controller
{
    public function redirect(Request $request, string $provider): RedirectResponse
    {
        $config = $this->providerConfig($provider);

        if ($config === null) {
            return redirect()->route('login')->with('status', ucfirst($provider).' sign-in is not configured yet.');
        }

        $redirectTo = LoginRedirectTarget::sanitize($request->string('redirect')->toString());
        $request->session()->forget('social_login.redirect_to');

        if ($redirectTo !== null) {
            $request->session()->put('social_login.redirect_to', $redirectTo);
        }

        $state = Str::random(40);
        $request->session()->put('social_login.state.'.$provider, $state);

        return redirect()->away($this->authorizationUrl($provider, $config, $state));
    }

    public function callback(Request $request, string $provider): RedirectResponse
    {
        $config = $this->providerConfig($provider);

        if ($config === null) {
            throw new NotFoundHttpException;
        }

        $request->validate([
            'code' => ['required', 'string'],
            'state' => ['required', 'string'],
        ]);

        $stateKey = 'social_login.state.'.$provider;
        $expectedState = $request->session()->pull($stateKey);

        abort_unless(is_string($expectedState) && hash_equals($expectedState, $request->string('state')->toString()), 419);

        $profile = $this->fetchProfile($provider, $config, $request->string('code')->toString());

        $email = $profile['email'] ?? null;
        $providerId = $profile['id'] ?? $profile['sub'] ?? null;

        if (! is_string($email) || ! filter_var($email, FILTER_VALIDATE_EMAIL)
            || ($profile['email_verified'] ?? false) !== true
            || (! is_string($providerId) && ! is_int($providerId)) || (string) $providerId === '') {
            return redirect()->route('login')->with('status', 'Sign-in requires a verified email address and a valid provider identity. Verify your email with the provider, then try again.');
        }

        $email = strtolower($email);
        $providerId = (string) $providerId;
        $name = $profile['name'] ?? $profile['login'] ?? $profile['given_name'] ?? $email;
        $avatarUrl = $profile['avatar_url'] ?? $profile['picture'] ?? null;

        // Provider identity owns the link. A matching email alone never links accounts.
        $user = User::query()->where('provider_name', $provider)->where('provider_id', $providerId)->first();
        $emailOwner = User::query()->whereRaw('LOWER(email) = ?', [$email])->first();

        if ($emailOwner && (! $user || ! $emailOwner->is($user))) {
            return redirect()->route('login')->with('status', 'An account already uses this email. Sign in with its original provider or password, or use Forgot your password to recover access. Social sign-in cannot link it automatically.');
        }

        if (! $user) {
            $user = new User;
            $user->password = Str::random(64);
            $user->role = 'commenter';
        }

        $user->name = is_string($name) && trim($name) !== '' ? $name : $email;
        $user->email = $email;
        $user->provider_name = $provider;
        $user->provider_id = $providerId;
        $user->avatar_url = is_string($avatarUrl) && trim($avatarUrl) !== '' ? $avatarUrl : null;

        // Promotion is limited to an email verified by the authenticated provider.
        $adminEmails = array_map('strtolower', (array) config('auth.super_admin_emails', []));
        if (in_array($email, $adminEmails, true)) {
            $user->role = 'admin';
        }

        $user->email_verified_at = now();
        try {
            $user->save();
        } catch (UniqueConstraintViolationException) {
            // A competing request claimed the email or provider identity first.
            return redirect()->route('login')->with('status', 'This identity or email was linked while you were signing in. Try signing in again, or use your original password or Forgot your password to recover access.');
        }

        Auth::login($user, true);
        $request->session()->regenerate();

        $redirectTo = LoginRedirectTarget::sanitize($request->session()->pull('social_login.redirect_to'))
            ?? route($user->isAdmin() ? 'dashboard' : 'blog.index', absolute: false);

        return redirect()->to($redirectTo);
    }

    /**
     * @return array<string, string>|null
     */
    private function providerConfig(string $provider): ?array
    {
        $config = config('services.'.$provider);

        if (! is_array($config) || empty($config['client_id']) || empty($config['client_secret']) || empty($config['redirect'])) {
            return null;
        }

        return $config;
    }

    /**
     * @param  array<string, string>  $config
     */
    private function authorizationUrl(string $provider, array $config, string $state): string
    {
        return match ($provider) {
            'github' => 'https://github.com/login/oauth/authorize?'.http_build_query([
                'client_id' => $config['client_id'],
                'redirect_uri' => $config['redirect'],
                'scope' => 'read:user user:email',
                'state' => $state,
            ]),
            'google' => 'https://accounts.google.com/o/oauth2/v2/auth?'.http_build_query([
                'client_id' => $config['client_id'],
                'redirect_uri' => $config['redirect'],
                'response_type' => 'code',
                'scope' => 'openid email profile',
                'access_type' => 'online',
                'prompt' => 'select_account',
                'state' => $state,
            ]),
            default => throw new NotFoundHttpException,
        };
    }

    /**
     * @param  array<string, string>  $config
     * @return array<string, mixed>
     */
    private function fetchProfile(string $provider, array $config, string $code): array
    {
        return match ($provider) {
            'github' => $this->fetchGitHubProfile($config, $code),
            'google' => $this->fetchGoogleProfile($config, $code),
            default => throw new NotFoundHttpException,
        };
    }

    /**
     * @param  array<string, string>  $config
     * @return array<string, mixed>
     */
    private function fetchGitHubProfile(array $config, string $code): array
    {
        $tokenResponse = Http::asForm()->acceptJson()->post('https://github.com/login/oauth/access_token', [
            'client_id' => $config['client_id'],
            'client_secret' => $config['client_secret'],
            'redirect_uri' => $config['redirect'],
            'code' => $code,
        ]);

        $accessToken = $tokenResponse->json('access_token');
        abort_unless(is_string($accessToken) && $accessToken !== '', 422, 'GitHub did not return an access token.');

        $profile = Http::withToken($accessToken)
            ->acceptJson()
            ->withHeaders([
                'User-Agent' => config('app.name', 'Laravel'),
            ])
            ->get('https://api.github.com/user')
            ->throw()
            ->json();

        // The public profile email has no verified flag; use the emails endpoint.
        $emails = Http::withToken($accessToken)
            ->acceptJson()
            ->withHeaders(['User-Agent' => config('app.name', 'Laravel')])
            ->get('https://api.github.com/user/emails')
            ->throw()
            ->json();

        $email = null;
        foreach (is_array($emails) ? $emails : [] as $entry) {
            if (data_get($entry, 'primary') === true && data_get($entry, 'verified') === true
                && is_string(data_get($entry, 'email'))) {
                $email = data_get($entry, 'email');
                break;
            }
        }

        return [
            'id' => data_get($profile, 'id'),
            'name' => data_get($profile, 'name') ?: data_get($profile, 'login'),
            'email' => $email,
            'email_verified' => $email !== null,
            'avatar_url' => data_get($profile, 'avatar_url'),
            'login' => data_get($profile, 'login'),
        ];
    }

    /**
     * @param  array<string, string>  $config
     * @return array<string, mixed>
     */
    private function fetchGoogleProfile(array $config, string $code): array
    {
        $tokenResponse = Http::asForm()->post('https://oauth2.googleapis.com/token', [
            'client_id' => $config['client_id'],
            'client_secret' => $config['client_secret'],
            'redirect_uri' => $config['redirect'],
            'grant_type' => 'authorization_code',
            'code' => $code,
        ]);

        $accessToken = $tokenResponse->json('access_token');
        abort_unless(is_string($accessToken) && $accessToken !== '', 422, 'Google did not return an access token.');

        return Http::withToken($accessToken)
            ->acceptJson()
            ->get('https://openidconnect.googleapis.com/v1/userinfo')
            ->throw()
            ->json();
    }
}
