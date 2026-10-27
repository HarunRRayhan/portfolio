import http from "@/lib/http";
import { router } from "@inertiajs/react";
import {
    startAuthentication,
    startRegistration,
} from "@simplewebauthn/browser";

export type SavedPasskey = { id: number; name: string };

// A starting name the user can edit after the passkey is created, e.g. "Chrome on Mac".
export function deviceName(): string {
    const ua = navigator.userAgent;
    const os = /iPhone/.test(ua)
        ? "iPhone"
        : /iPad/.test(ua)
          ? "iPad"
          : /Android/.test(ua)
            ? "Android"
            : /Mac/.test(ua)
              ? "Mac"
              : /Windows/.test(ua)
                ? "Windows"
                : /Linux/.test(ua)
                  ? "Linux"
                  : "this device";
    const browser = /Edg\//.test(ua)
        ? "Edge"
        : /Firefox\//.test(ua)
          ? "Firefox"
          : /Chrome\//.test(ua)
            ? "Chrome"
            : /Safari\//.test(ua)
              ? "Safari"
              : null;

    return browser ? `${browser} on ${os}` : os;
}

export async function registerPasskey(
    name: string = deviceName(),
): Promise<SavedPasskey> {
    const { data: optionsJSON } = await http.get(
        route("passkeys.register-options"),
    );
    const passkey = await startRegistration({ optionsJSON });
    const { data } = await http.post<SavedPasskey>(route("passkeys.store"), {
        name,
        passkey: JSON.stringify(passkey),
    });

    return data;
}

export async function renamePasskey(id: number, name: string): Promise<void> {
    await http.patch(route("passkeys.update", id), { name });
}

export async function loginWithPasskey(redirect?: string): Promise<void> {
    const { data: optionsJSON } = await http.get(
        route("passkeys.login-options"),
    );
    const answer = await startAuthentication({ optionsJSON });

    // Inertia follows the server redirect (session regenerated, sanitized target).
    await new Promise<void>((resolve, reject) => {
        router.post(
            route("passkeys.login"),
            { answer: JSON.stringify(answer), redirect: redirect ?? "" },
            {
                onSuccess: () => resolve(),
                // onFinish also covers 419/429 and network failures; it is a no-op after resolve.
                onFinish: () => reject(new Error("Passkey sign-in failed")),
            },
        );
    });
}
