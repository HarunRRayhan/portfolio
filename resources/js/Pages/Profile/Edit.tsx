import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import DeleteUserForm from './Partials/DeleteUserForm';
import PublicProfileForm from './Partials/PublicProfileForm';
import PasskeysSection, { PasskeyRow } from './Partials/PasskeysSection';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';

export default function Edit({
    mustVerifyEmail,
    status,
    passkeys,
}: PageProps<{ mustVerifyEmail: boolean; status?: string; passkeys: PasskeyRow[] }>) {
    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    Profile
                </h2>
            }
        >
            <Head title="Profile" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl space-y-6 sm:px-6 lg:px-8">
                    <div className="bg-white p-4 shadow sm:rounded-lg sm:p-8">
                        <UpdateProfileInformationForm
                            mustVerifyEmail={mustVerifyEmail}
                            status={status}
                            className="max-w-xl"
                        />
                    </div>

                    <div id="newsletter" className="scroll-mt-20 bg-white p-4 shadow sm:rounded-lg sm:p-8">
                        <NewsletterSection />
                    </div>

                    <div id="public-profile" className="scroll-mt-20 bg-white p-4 shadow sm:rounded-lg sm:p-8">
                        <PublicProfileForm className="max-w-xl" />
                    </div>

                    <div id="passkeys" className="scroll-mt-20 bg-white p-4 shadow sm:rounded-lg sm:p-8">
                        <PasskeysSection passkeys={passkeys} className="max-w-xl" />
                    </div>

                    <div id="delete-account" className="scroll-mt-20 bg-white p-4 shadow sm:rounded-lg sm:p-8">
                        <DeleteUserForm className="max-w-xl" />
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

/** Weekly newsletter on/off for the account email; it also carries the roadmap progress. */
function NewsletterSection() {
    const subscribed = Boolean((usePage().props as { newsletter?: { accountSubscribed?: boolean } }).newsletter?.accountSubscribed);
    const [busy, setBusy] = useState(false);
    const toggle = () => {
        setBusy(true);
        const options = { preserveScroll: true, onFinish: () => setBusy(false) };
        if (subscribed) router.delete(route('newsletter.account.unsubscribe'), options);
        else router.post(route('newsletter.account'), {}, options);
    };

    return (
        <section className="max-w-xl">
            <h2 className="text-lg font-medium text-gray-900">Weekly newsletter</h2>
            <p className="mt-1 text-sm text-gray-600">
                {subscribed
                    ? 'You get one email a week with new posts, roadmap updates and your roadmap progress.'
                    : 'You are not subscribed. Turn it on to get new posts, roadmap updates and your roadmap progress once a week.'}
            </p>
            <button
                type="button"
                onClick={toggle}
                disabled={busy}
                className="mt-4 rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
            >
                {subscribed ? 'Unsubscribe' : 'Subscribe'}
            </button>
        </section>
    );
}
