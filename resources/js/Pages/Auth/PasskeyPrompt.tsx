import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import GuestLayout from '@/Layouts/GuestLayout';
import { registerPasskey } from '@/lib/passkeys';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';

// `next` (the post-signup target) is held server-side; Skip redirects there.
export default function PasskeyPrompt() {
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const skip = () => router.post(route('passkeys.skip'));

    const add = async () => {
        setBusy(true);
        setError(null);
        try {
            await registerPasskey('Added at sign-up');
            skip();
        } catch {
            setError('Could not add a passkey. You can try again or skip.');
            setBusy(false);
        }
    };

    return (
        <GuestLayout>
            <Head title="Add a passkey" />

            <h1 className="mb-2 text-lg font-semibold text-gray-900">Add a passkey</h1>
            <p className="mb-4 text-sm text-gray-600">
                Add a passkey so next time you can sign in with Face ID, Touch ID or your device PIN. Optional.
            </p>

            {error && (
                <p role="alert" className="mb-4 text-sm text-red-600">
                    {error}
                </p>
            )}

            <div className="flex flex-wrap gap-3">
                <PrimaryButton type="button" onClick={add} disabled={busy}>
                    Add a passkey
                </PrimaryButton>
                <SecondaryButton onClick={skip} disabled={busy}>
                    Skip for now
                </SecondaryButton>
            </div>
        </GuestLayout>
    );
}
