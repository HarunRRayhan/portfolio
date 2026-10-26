import http from '@/lib/http';
import { router } from '@inertiajs/react';
import { startAuthentication, startRegistration } from '@simplewebauthn/browser';

export async function registerPasskey(name: string): Promise<void> {
    const { data: optionsJSON } = await http.get(route('passkeys.register-options'));
    const passkey = await startRegistration({ optionsJSON });
    await http.post(route('passkeys.store'), { name, passkey: JSON.stringify(passkey) });
}

export async function loginWithPasskey(redirect?: string): Promise<void> {
    const { data: optionsJSON } = await http.get(route('passkeys.login-options'));
    const answer = await startAuthentication({ optionsJSON });

    // Inertia follows the server redirect (session regenerated, sanitized target).
    await new Promise<void>((resolve, reject) => {
        router.post(
            route('passkeys.login'),
            { answer: JSON.stringify(answer), redirect: redirect ?? '' },
            { onSuccess: () => resolve(), onError: () => reject(new Error('Passkey sign-in failed')) },
        );
    });
}
