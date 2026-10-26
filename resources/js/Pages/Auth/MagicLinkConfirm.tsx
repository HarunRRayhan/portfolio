import PrimaryButton from '@/Components/PrimaryButton';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

export default function MagicLinkConfirm({
    token,
    email,
}: {
    token: string;
    email: string;
}) {
    const { post, processing } = useForm({});

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('magic-link.consume', token));
    };

    return (
        <GuestLayout>
            <Head title="Finish signing in" />

            <h1 className="mb-2 text-lg font-semibold text-gray-900">
                Finish signing in
            </h1>
            <p className="mb-4 text-sm text-gray-600">Continue as {email}</p>

            <form onSubmit={submit}>
                <PrimaryButton disabled={processing}>Continue</PrimaryButton>
            </form>
        </GuestLayout>
    );
}
