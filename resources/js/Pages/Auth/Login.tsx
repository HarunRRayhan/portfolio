import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import SocialLoginButtons from '@/Components/SocialLoginButtons';
import TextInput from '@/Components/TextInput';
import Turnstile from '@/Components/Turnstile';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, useForm, usePage } from '@inertiajs/react';
import { FormEventHandler } from 'react';

export default function Login({
    status,
    redirect,
    turnstileEnabled,
}: {
    status?: string;
    redirect?: string;
    turnstileEnabled: boolean;
}) {
    const siteKey = (usePage().props as { turnstileSiteKey?: string | null }).turnstileSiteKey;
    const enabled = turnstileEnabled && !!siteKey;

    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        'cf-turnstile-response': '',
        redirect: redirect ?? '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('magic-link.send'), {
            onSuccess: () => reset('email'),
        });
    };

    return (
        <GuestLayout>
            <Head title="Continue" />

            <h1 className="text-xl font-semibold text-slate-900">Continue to harun.dev</h1>
            <p className="mb-6 mt-1 text-sm text-slate-500">New here? Any option creates your account.</p>

            {status && <div className="mb-4 text-sm font-medium text-green-600">{status}</div>}

            <SocialLoginButtons redirectTo={redirect} />

            <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-wide text-slate-400">
                <span className="h-px flex-1 bg-slate-200" />
                or
                <span className="h-px flex-1 bg-slate-200" />
            </div>

            <form onSubmit={submit} className="space-y-4">
                <div>
                    <InputLabel htmlFor="email" value="Email" />
                    <TextInput
                        id="email"
                        type="email"
                        name="email"
                        value={data.email}
                        className="mt-1 block w-full"
                        autoComplete="username webauthn"
                        onChange={(e) => setData('email', e.target.value)}
                        required
                        disabled={!enabled}
                    />
                    <InputError message={errors.email} className="mt-2" />
                </div>

                {enabled ? (
                    <Turnstile siteKey={siteKey!} onToken={(t) => setData('cf-turnstile-response', t)} />
                ) : (
                    <p className="text-sm text-slate-500">Email sign-in is temporarily unavailable.</p>
                )}

                <PrimaryButton
                    className="w-full justify-center"
                    disabled={!enabled || processing || !data['cf-turnstile-response']}
                >
                    Email me a sign-in link
                </PrimaryButton>
            </form>

            {/* Wired up in the passkey task. */}
            <button
                type="button"
                disabled
                className="mt-4 inline-flex w-full cursor-not-allowed items-center justify-center rounded-full border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-400"
            >
                Sign in with passkey
            </button>
        </GuestLayout>
    );
}
