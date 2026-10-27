<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Support\CompleteLogin;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Validation\ValidationException;
use Spatie\LaravelPasskeys\Actions\FindPasskeyToAuthenticateAction;
use Spatie\LaravelPasskeys\Actions\GeneratePasskeyAuthenticationOptionsAction;
use Spatie\LaravelPasskeys\Actions\GeneratePasskeyRegisterOptionsAction;
use Spatie\LaravelPasskeys\Actions\StorePasskeyAction;
use Spatie\LaravelPasskeys\Models\Passkey;
use Spatie\LaravelPasskeys\Support\Config;
use Spatie\LaravelPasskeys\Support\Serializer;
use Throwable;

class PasskeyController extends Controller
{
    private const REGISTER_OPTIONS = 'passkey-registration-options';

    private const LOGIN_OPTIONS = 'passkey-authentication-options';

    public function registerOptions(Request $request): JsonResponse
    {
        $options = Config::getAction('generate_passkey_register_options', GeneratePasskeyRegisterOptionsAction::class)
            ->execute($request->user(), asJson: false);

        // Tell the authenticator which credentials this user already has, so it won't create a duplicate.
        $options->excludeCredentials = $request->user()->passkeys
            ->map(fn (Passkey $passkey) => $passkey->data->getPublicKeyCredentialDescriptor())
            ->all();

        $options = Serializer::make()->toJson($options);

        $request->session()->put(self::REGISTER_OPTIONS, $options);

        return JsonResponse::fromJsonString($options);
    }

    public function store(Request $request): HttpResponse
    {
        $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'passkey' => ['required', 'json'],
        ]);

        $options = $request->session()->pull(self::REGISTER_OPTIONS);

        try {
            Config::getAction('store_passkey', StorePasskeyAction::class)->execute(
                $request->user(),
                $request->input('passkey'),
                (string) $options,
                Config::getRelyingPartyId(),
                ['name' => $request->input('name')],
            );
        } catch (UniqueConstraintViolationException) {
            // credential_id is unique across all users; a credential can only belong to one account.
            throw ValidationException::withMessages(['passkey' => 'This passkey is already registered.']);
        } catch (Throwable) {
            throw ValidationException::withMessages(['passkey' => 'That passkey could not be saved. Try again.']);
        }

        return response()->noContent();
    }

    public function destroy(Request $request, string $passkey): RedirectResponse
    {
        $request->user()->passkeys()->findOrFail($passkey)->delete();

        return back();
    }

    public function loginOptions(Request $request): JsonResponse
    {
        // The action stores the options in the session itself.
        $options = Config::getAction('generate_passkey_authentication_options', GeneratePasskeyAuthenticationOptionsAction::class)
            ->execute();

        return JsonResponse::fromJsonString($options);
    }

    public function login(Request $request): RedirectResponse
    {
        $request->validate([
            'answer' => ['required', 'json'],
            'redirect' => ['nullable', 'string'],
        ]);

        $options = $request->session()->pull(self::LOGIN_OPTIONS);

        try {
            $passkey = blank($options) ? null : Config::getAction('find_passkey', FindPasskeyToAuthenticateAction::class)
                ->execute($request->input('answer'), $options);
        } catch (Throwable) {
            $passkey = null;
        }

        $user = $passkey?->authenticatable;

        if (! $user instanceof User) {
            throw ValidationException::withMessages(['answer' => 'Passkey sign-in failed. Try another option.']);
        }

        return CompleteLogin::redirect($request, $user, $request->input('redirect'));
    }
}
