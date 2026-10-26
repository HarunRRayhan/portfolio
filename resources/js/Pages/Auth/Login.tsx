import SocialLoginButtons from '@/Components/SocialLoginButtons';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head } from '@inertiajs/react';

export default function Login({ status }: { status?: string }) {
    return (
        <GuestLayout>
            <Head title="Log in" />

            {status && (
                <div className="mb-4 text-sm font-medium text-green-600">
                    {status}
                </div>
            )}

            <div className="mb-6">
                <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-slate-500">
                    Social sign-in
                </h2>
                <p className="mb-3 text-xs text-slate-400">Sign in with <strong>Google</strong> (admin). GitHub sign-in is coming soon.</p>
                <SocialLoginButtons />
            </div>
        </GuestLayout>
    );
}
