import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import { Link, useForm, usePage } from '@inertiajs/react';
import { FormEventHandler } from 'react';

export default function PublicProfileForm({ className = '' }: { className?: string }) {
    const user = usePage().props.auth.user;
    const { data, setData, patch, errors, processing, recentlySuccessful } = useForm({
        username: user.username ?? '',
        bio: user.bio ?? '',
        anonymous: !!user.anonymous,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        patch(route('profile.public.update'), { preserveScroll: true });
    };

    return (
        <section className={className}>
            <header>
                <h2 className="text-lg font-medium text-gray-900">Public profile</h2>
                <p className="mt-1 text-sm text-gray-600">
                    Your profile is public and linked from the leaderboard. Your email is never shown.{' '}
                    <Link href={`/u/${user.profile_handle}`} className="underline">View your profile</Link>
                </p>
            </header>

            <form onSubmit={submit} className="mt-6 space-y-6">
                <div>
                    <InputLabel htmlFor="username" value="Username" />
                    <div className="mt-1 flex rounded-md shadow-sm">
                        <span className="inline-flex items-center rounded-l-md border border-r-0 border-gray-300 bg-gray-50 px-3 text-sm text-gray-500">harun.dev/u/</span>
                        <input
                            id="username"
                            value={data.username}
                            onChange={(e) => setData('username', e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                            maxLength={30}
                            placeholder="your_name"
                            autoComplete="off"
                            className="block w-full min-w-0 rounded-none rounded-r-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                        />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">3–30 characters: lowercase letters, numbers and _, starting with a letter. Hidden while you're anonymous.</p>
                    <InputError className="mt-2" message={errors.username} />
                </div>

                <div>
                    <InputLabel htmlFor="bio" value="Bio" />
                    <textarea
                        id="bio"
                        rows={3}
                        maxLength={280}
                        value={data.bio}
                        onChange={(e) => setData('bio', e.target.value)}
                        placeholder="What are you learning?"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                    <p className="mt-1 text-xs text-gray-500">{data.bio.length}/280</p>
                    <InputError className="mt-2" message={errors.bio} />
                </div>

                <label className="flex items-start gap-3">
                    <input
                        type="checkbox"
                        checked={data.anonymous}
                        onChange={(e) => setData('anonymous', e.target.checked)}
                        className="mt-1 rounded border-gray-300 text-indigo-600"
                    />
                    <span className="text-sm text-gray-700">
                        <span className="font-medium">Stay anonymous</span>
                        <span className="block text-gray-500">
                            Your name and picture are replaced by a random name
                            {user.anonymous && user.anon_name ? <> (<strong>{user.anon_name}</strong>)</> : ' like "Quiet Falcon"'} on your
                            profile, the leaderboard and roadmap comments. Your profile link changes when you switch.
                        </span>
                    </span>
                </label>

                <div className="flex items-center gap-4">
                    <PrimaryButton disabled={processing}>Save</PrimaryButton>
                    {recentlySuccessful && <p className="text-sm text-gray-600">Saved.</p>}
                </div>
            </form>
        </section>
    );
}
