import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import { registerPasskey } from '@/lib/passkeys';
import { router } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';

export type PasskeyRow = {
    id: number;
    name: string;
    created_at: string;
    last_used_at: string | null;
};

const date = (iso: string) => new Date(iso).toLocaleDateString();

export default function PasskeysSection({ passkeys, className = '' }: { passkeys: PasskeyRow[]; className?: string }) {
    const [name, setName] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const add: FormEventHandler = async (e) => {
        e.preventDefault();
        setBusy(true);
        setError(null);
        try {
            await registerPasskey(name);
            setName('');
            router.reload({ only: ['passkeys'] });
        } catch {
            setError('Could not add the passkey. Try again.');
        } finally {
            setBusy(false);
        }
    };

    const remove = (passkey: PasskeyRow) => {
        if (confirm(`Delete the passkey "${passkey.name}"?`)) {
            router.delete(route('passkeys.destroy', passkey.id), { preserveScroll: true });
        }
    };

    return (
        <section className={className}>
            <header>
                <h2 className="text-lg font-medium text-gray-900">Passkeys</h2>
                <p className="mt-1 text-sm text-gray-600">
                    Sign in with Face ID, Touch ID or your device PIN instead of an email link.
                </p>
            </header>

            {passkeys.length > 0 && (
                <ul className="mt-6 divide-y divide-gray-200 rounded-md border border-gray-200">
                    {passkeys.map((passkey) => (
                        <li key={passkey.id} className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
                            <div>
                                <p className="font-medium text-gray-900">{passkey.name}</p>
                                <p className="text-gray-500">
                                    Added {date(passkey.created_at)}
                                    {passkey.last_used_at && ` · Last used ${date(passkey.last_used_at)}`}
                                </p>
                            </div>
                            <SecondaryButton onClick={() => remove(passkey)}>Delete</SecondaryButton>
                        </li>
                    ))}
                </ul>
            )}

            <form onSubmit={add} className="mt-6 flex flex-wrap items-end gap-3">
                <div className="grow">
                    <InputLabel htmlFor="passkey-name" value="Passkey name" />
                    <TextInput
                        id="passkey-name"
                        value={name}
                        className="mt-1 block w-full"
                        placeholder="e.g. MacBook"
                        maxLength={255}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />
                </div>
                <PrimaryButton disabled={busy || !name.trim()}>Add a passkey</PrimaryButton>
            </form>

            {error && (
                <p role="alert" className="mt-2 text-sm text-red-600">
                    {error}
                </p>
            )}
        </section>
    );
}
