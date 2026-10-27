import PrimaryButton from "@/Components/PrimaryButton";
import SecondaryButton from "@/Components/SecondaryButton";
import GuestLayout from "@/Layouts/GuestLayout";
import { Head, router, useForm } from "@inertiajs/react";

// Shown after signing in to an account that was deleted less than 30 days ago.
export default function RestoreAccount({ purgesOn }: { purgesOn: string }) {
    const { post, processing } = useForm({});
    const date = new Date(`${purgesOn}T00:00:00`).toLocaleDateString(
        undefined,
        { dateStyle: "long" },
    );

    return (
        <GuestLayout>
            <Head title="Restore your account" />

            <h1 className="mb-2 text-lg font-semibold text-gray-900">
                This account is scheduled for deletion
            </h1>
            <p className="mb-6 text-sm text-gray-600">
                It will be permanently deleted on <strong>{date}</strong>.
                Restore it to keep using it, or log out and let the deletion go
                ahead.
            </p>

            <div className="flex flex-wrap gap-3">
                <PrimaryButton
                    type="button"
                    onClick={() => post(route("account.restore.store"))}
                    disabled={processing}
                >
                    Restore my account
                </PrimaryButton>
                <SecondaryButton
                    onClick={() => router.post(route("logout"))}
                    disabled={processing}
                >
                    Log out
                </SecondaryButton>
            </div>
        </GuestLayout>
    );
}
