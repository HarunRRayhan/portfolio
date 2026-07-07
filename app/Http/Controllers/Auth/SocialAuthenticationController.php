<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
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

        $redirectTo = $this->sanitizeRedirectTarget($request->string('redirect')->toString());

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
            throw new NotFoundHttpException();
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
        $name = $profile['name'] ?? $profile['login'] ?? $profile['given_name'] ?? $profile['email'];
        $providerId = (string) ($profile['id'] ?? $profile['sub'] ?? '');
        $avatarUrl = $profile['avatar_url'] ?? $profile['picture'] ?? null;

        if (! is_string($email) || trim($email) === '') {
            abort(422, 'Social login provider did not return an email address.');
        }

        /** @var User $user */
        $user = User::query()->firstOrNew([
            'email' => $email,
        ]);

        $user->name = is_string($name) && trim($name) !== '' ? $name : $email;
        $user->email = $email;
        $user->provider_name = $provider;
        $user->provider_id = $providerId !== '' ? $providerId : null;
        $user->avatar_url = is_string($avatarUrl) && trim($avatarUrl) !== '' ? $avatarUrl : null;

        if (! $user->exists) {
            $user->password = Str::random(64);
        }

        // Auto-promote configured super-admin emails to admin role
        $adminEmails = (array) config('auth.super_admin_emails', []);
        if (in_array($user->email, $adminEmails, true) && $user->role !== 'admin') {
            $user->role = 'admin';
        }

        $user->email_verified_at ??= now();
        $user->save();

        Auth::login($user, true);

        $redirectTo = $this->sanitizeRedirectTarget($request->session()->pull('social_login.redirect_to'))
            ?? route('dashboard', absolute: false);

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
            default => throw new NotFoundHttpException(),
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
            default => throw new NotFoundHttpException(),
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

        $email = data_get($profile, 'email');

        if (! is_string($email) || trim($email) === '') {
            $emails = Http::withToken($accessToken)
                ->acceptJson()
                ->withHeaders([
                    'User-Agent' => config('app.name', 'Laravel'),
                ])
                ->get('https://api.github.com/user/emails')
                ->throw()
                ->json();

            foreach (is_array($emails) ? $emails : [] as $entry) {
                if (data_get($entry, 'primary') && data_get($entry, 'verified') && is_string(data_get($entry, 'email'))) {
                    $email = data_get($entry, 'email');
                    break;
                }
            }
        }

        return [
            'id' => data_get($profile, 'id'),
            'name' => data_get($profile, 'name') ?: data_get($profile, 'login'),
            'email' => $email,
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

    private function sanitizeRedirectTarget(?string $redirectTarget): ?string
    {
        if (! is_string($redirectTarget) || trim($redirectTarget) === '') {
            return null;
        }

        if (str_starts_with($redirectTarget, '/')) {
            return $redirectTarget;
        }

        $appUrl = rtrim(config('app.url', url('/')), '/');
        $redirectHost = parse_url($redirectTarget, PHP_URL_HOST);
        $appHost = parse_url($appUrl, PHP_URL_HOST);

        if ($redirectHost !== null && $appHost !== null && strcasecmp($redirectHost, $appHost) === 0) {
            return $redirectTarget;
        }

        return null;
    }
}
