import Checkbox from "@/Components/Checkbox";
import InputError from "@/Components/InputError";
import InputLabel from "@/Components/InputLabel";
import PrimaryButton from "@/Components/PrimaryButton";
import SecondaryButton from "@/Components/SecondaryButton";
import TextInput from "@/Components/TextInput";
import GuestLayout from "@/Layouts/GuestLayout";
import { registerPasskey, renamePasskey, SavedPasskey } from "@/lib/passkeys";
import { Head, useForm } from "@inertiajs/react";
import { FormEventHandler, useState } from "react";

// Shown once per account: agreeing is required, the passkey is optional.
// Where to go next is held server-side and applied on accept.
export default function Welcome({ hasPasskey }: { hasPasskey: boolean }) {
    const { data, setData, post, processing, errors } = useForm({
        terms: false,
    });
    const [busy, setBusy] = useState(false);
    const [passkeyError, setPasskeyError] = useState<string | null>(null);

    const [saved, setSaved] = useState<SavedPasskey | null>(null);
    const [passkeyName, setPasskeyName] = useState("");

    const accept = () => post(route("agreement.accept"));

    const addPasskey = async () => {
        setBusy(true);
        setPasskeyError(null);
        try {
            const passkey = await registerPasskey();
            setSaved(passkey);
            setPasskeyName(passkey.name);
        } catch {
            setPasskeyError(
                "Could not add a passkey. Try again, or continue without one.",
            );
        } finally {
            setBusy(false);
        }
    };

    const saveNameAndContinue: FormEventHandler = async (e) => {
        e.preventDefault();
        if (!saved) return;
        setBusy(true);
        setPasskeyError(null);
        try {
            if (passkeyName.trim() !== saved.name)
                await renamePasskey(saved.id, passkeyName.trim());
            accept();
        } catch {
            setPasskeyError("Could not rename the passkey. Try again.");
            setBusy(false);
        }
    };

    const disabled = !data.terms || busy || processing;

    return (
        <GuestLayout>
            <Head title="Welcome" />

            <h1 className="mb-2 text-lg font-semibold text-gray-900">
                Welcome to harun.dev
            </h1>
            <p className="mb-4 text-sm text-gray-600">
                One quick step before you continue.
            </p>

            <label className="flex items-start gap-3 text-sm text-gray-700">
                <Checkbox
                    name="terms"
                    className="mt-0.5"
                    checked={data.terms}
                    onChange={(e) => setData("terms", e.target.checked)}
                />
                <span>
                    I agree to the{" "}
                    <a
                        href={route("terms")}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline"
                    >
                        Terms
                    </a>{" "}
                    and{" "}
                    <a
                        href={route("privacy")}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline"
                    >
                        Privacy Policy
                    </a>
                    .
                </span>
            </label>
            <InputError message={errors.terms} className="mt-2" />

            {hasPasskey ? (
                <div className="mt-6">
                    <PrimaryButton
                        type="button"
                        onClick={accept}
                        disabled={disabled}
                    >
                        Continue
                    </PrimaryButton>
                </div>
            ) : saved ? (
                <form onSubmit={saveNameAndContinue} className="mt-6">
                    <h2 className="mb-1 text-sm font-semibold text-gray-900">
                        Passkey added
                    </h2>
                    <p className="mb-4 text-sm text-gray-600">
                        Give it a name you will recognise. You can rename or
                        remove it later from your profile.
                    </p>
                    <InputLabel htmlFor="passkey-name" value="Passkey name" />
                    <TextInput
                        id="passkey-name"
                        value={passkeyName}
                        className="mt-1 block w-full"
                        maxLength={255}
                        onChange={(e) => setPasskeyName(e.target.value)}
                        required
                    />
                    {passkeyError && (
                        <p role="alert" className="mt-2 text-sm text-red-600">
                            {passkeyError}
                        </p>
                    )}
                    <PrimaryButton
                        className="mt-4"
                        disabled={disabled || !passkeyName.trim()}
                    >
                        Save and continue
                    </PrimaryButton>
                </form>
            ) : (
                <>
                    <h2 className="mt-6 mb-1 text-sm font-semibold text-gray-900">
                        Add a passkey (optional)
                    </h2>
                    <p className="mb-4 text-sm text-gray-600">
                        Sign in next time with Face ID, Touch ID or your device
                        PIN. You can add or remove passkeys later from your
                        profile.
                    </p>

                    {passkeyError && (
                        <p role="alert" className="mb-4 text-sm text-red-600">
                            {passkeyError}
                        </p>
                    )}

                    <div className="flex flex-wrap gap-3">
                        <PrimaryButton
                            type="button"
                            onClick={addPasskey}
                            disabled={disabled}
                        >
                            Add a passkey
                        </PrimaryButton>
                        <SecondaryButton onClick={accept} disabled={disabled}>
                            Skip passkey
                        </SecondaryButton>
                    </div>
                </>
            )}
        </GuestLayout>
    );
}
