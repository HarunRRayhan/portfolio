import PrimaryButton from "@/Components/PrimaryButton";
import SecondaryButton from "@/Components/SecondaryButton";
import TextInput from "@/Components/TextInput";
import { registerPasskey, renamePasskey } from "@/lib/passkeys";
import { router } from "@inertiajs/react";
import { FormEventHandler, useState } from "react";

export type PasskeyRow = {
    id: number;
    name: string;
    created_at: string;
    last_used_at: string | null;
};

const date = (iso: string) => new Date(iso).toLocaleDateString();

export default function PasskeysSection({
    passkeys,
    className = "",
}: {
    passkeys: PasskeyRow[];
    className?: string;
}) {
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    // The passkey being renamed; a new passkey opens here so its suggested name can be changed.
    const [editing, setEditing] = useState<{ id: number; name: string } | null>(
        null,
    );

    const add = async () => {
        setBusy(true);
        setError(null);
        try {
            const passkey = await registerPasskey();
            setEditing(passkey);
            router.reload({ only: ["passkeys"] });
        } catch {
            setError("Could not add the passkey. Try again.");
        } finally {
            setBusy(false);
        }
    };

    const rename: FormEventHandler = async (e) => {
        e.preventDefault();
        if (!editing) return;
        setBusy(true);
        setError(null);
        try {
            await renamePasskey(editing.id, editing.name.trim());
            setEditing(null);
            router.reload({ only: ["passkeys"] });
        } catch {
            setError("Could not rename the passkey. Try again.");
        } finally {
            setBusy(false);
        }
    };

    const remove = (passkey: PasskeyRow) => {
        if (confirm(`Delete the passkey "${passkey.name}"?`)) {
            router.delete(route("passkeys.destroy", passkey.id), {
                preserveScroll: true,
            });
        }
    };

    return (
        <section className={className}>
            <header>
                <h2 className="text-lg font-medium text-gray-900">Passkeys</h2>
                <p className="mt-1 text-sm text-gray-600">
                    Sign in with Face ID, Touch ID or your device PIN instead of
                    an email link.
                </p>
            </header>

            {passkeys.length > 0 && (
                <ul className="mt-6 divide-y divide-gray-200 rounded-md border border-gray-200">
                    {passkeys.map((passkey) => (
                        <li key={passkey.id} className="px-4 py-3 text-sm">
                            {editing?.id === passkey.id ? (
                                <form
                                    onSubmit={rename}
                                    className="flex flex-wrap items-center gap-3"
                                >
                                    <TextInput
                                        aria-label="Passkey name"
                                        value={editing.name}
                                        className="block grow"
                                        maxLength={255}
                                        onChange={(e) =>
                                            setEditing({
                                                id: passkey.id,
                                                name: e.target.value,
                                            })
                                        }
                                        isFocused
                                        required
                                    />
                                    <PrimaryButton
                                        disabled={busy || !editing.name.trim()}
                                    >
                                        Save
                                    </PrimaryButton>
                                    <SecondaryButton
                                        onClick={() => setEditing(null)}
                                    >
                                        Cancel
                                    </SecondaryButton>
                                </form>
                            ) : (
                                <div className="flex items-center justify-between gap-4">
                                    <div>
                                        <p className="font-medium text-gray-900">
                                            {passkey.name}
                                        </p>
                                        <p className="text-gray-500">
                                            Added {date(passkey.created_at)}
                                            {passkey.last_used_at &&
                                                ` · Last used ${date(passkey.last_used_at)}`}
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <SecondaryButton
                                            onClick={() =>
                                                setEditing({
                                                    id: passkey.id,
                                                    name: passkey.name,
                                                })
                                            }
                                        >
                                            Rename
                                        </SecondaryButton>
                                        <SecondaryButton
                                            onClick={() => remove(passkey)}
                                        >
                                            Delete
                                        </SecondaryButton>
                                    </div>
                                </div>
                            )}
                        </li>
                    ))}
                </ul>
            )}

            <PrimaryButton
                type="button"
                className="mt-6"
                onClick={add}
                disabled={busy}
            >
                Add a passkey
            </PrimaryButton>

            {error && (
                <p role="alert" className="mt-2 text-sm text-red-600">
                    {error}
                </p>
            )}
        </section>
    );
}
