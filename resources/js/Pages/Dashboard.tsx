import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { getImageUrl } from "@/lib/imageUtils";

interface PostSummary {
    title: string;
    slug: string;
    brief: string;
    publishedAtHuman: string;
    readTimeLabel: string;
    coverImageUrl: string | null;
    url: string;
    isDraft?: boolean;
    draftPreviewUrl?: string | null;
}

interface DashboardStats {
    totalPosts: number;
    publishedPosts: number;
    draftPosts: number;
    previewReadyDrafts: number;
}

interface Props {
    stats: DashboardStats;
    panelStatus: string;
    panelStatusDetail: string;
    recentPosts: PostSummary[];
    draftPostsList: PostSummary[];
}

export default function Dashboard({ stats, recentPosts, draftPostsList }: Props) {
    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-neutral-100">
                    Dashboard
                </h2>
            }
        >
            <Head>
                <title>Dashboard | Harun R. Rayhan - Cloud & DevOps Services</title>
                <meta name="description" content="Access your personal dashboard to manage your cloud and DevOps services, view project status, and track consultations." />
                <meta name="keywords" content="dashboard, client portal, cloud services management, DevOps projects" />

                {/* OpenGraph Tags */}
                <meta property="og:title" content="Dashboard | Harun R. Rayhan - Cloud & DevOps Services" />
                <meta property="og:description" content="Access your personal dashboard to manage your cloud and DevOps services, view project status, and track consultations." />
                <meta property="og:type" content="website" />
                <meta property="og:url" content={window.location.href} />

                {/* Twitter Card Tags */}
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content="Dashboard | Harun R. Rayhan - Cloud & DevOps Services" />
                <meta name="twitter:description" content="Access your personal dashboard to manage your cloud and DevOps services, view project status, and track consultations." />

                {/* Canonical URL */}
                <link rel="canonical" href={window.location.href} />

                {/* JSON-LD Structured Data */}
                <script type="application/ld+json">
                    {JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "WebPage",
                        "name": "Client Dashboard - Harun R. Rayhan",
                        "description": "Personal dashboard for managing cloud and DevOps services",
                        "isAccessibleForFree": false,
                        "breadcrumb": {
                            "@type": "BreadcrumbList",
                            "itemListElement": [{
                                "@type": "ListItem",
                                "position": 1,
                                "name": "Dashboard",
                                "item": window.location.href
                            }]
                        }
                    })}
                </script>
            </Head>

            <div className="py-6 sm:py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8 space-y-6">
                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="bg-white dark:bg-neutral-800 shadow-sm sm:rounded-lg p-4 sm:p-6 border border-neutral-200 dark:border-neutral-700">
                            <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Total Posts</p>
                            <p className="text-2xl sm:text-3xl font-semibold text-neutral-900 dark:text-white mt-1">{stats.totalPosts}</p>
                        </div>
                        <div className="bg-white dark:bg-neutral-800 shadow-sm sm:rounded-lg p-4 sm:p-6 border border-neutral-200 dark:border-neutral-700">
                            <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Published</p>
                            <p className="text-2xl sm:text-3xl font-semibold text-emerald-600 dark:text-emerald-400 mt-1">{stats.publishedPosts}</p>
                        </div>
                        <div className="bg-white dark:bg-neutral-800 shadow-sm sm:rounded-lg p-4 sm:p-6 border border-neutral-200 dark:border-neutral-700">
                            <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Drafts</p>
                            <p className="text-2xl sm:text-3xl font-semibold text-amber-600 dark:text-amber-400 mt-1">{stats.draftPosts}</p>
                        </div>
                        <div className="bg-white dark:bg-neutral-800 shadow-sm sm:rounded-lg p-4 sm:p-6 border border-neutral-200 dark:border-neutral-700">
                            <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Preview Ready</p>
                            <p className="text-2xl sm:text-3xl font-semibold text-blue-600 dark:text-blue-400 mt-1">{stats.previewReadyDrafts}</p>
                        </div>
                    </div>

                    {/* Recent Published Posts */}
                    <div className="bg-white dark:bg-neutral-800 shadow-sm sm:rounded-lg border border-neutral-200 dark:border-neutral-700">
                        <div className="px-4 sm:px-6 py-4 border-b border-neutral-200 dark:border-neutral-700">
                            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">Recent Published Posts</h3>
                        </div>
                        <div className="divide-y divide-neutral-200 dark:divide-neutral-700">
                            {recentPosts.length > 0 ? recentPosts.map((post) => (
                                <Link
                                    key={post.slug}
                                    href={post.url}
                                    className="block px-4 sm:px-6 py-4 hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-medium text-neutral-900 dark:text-white truncate">{post.title}</p>
                                            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 line-clamp-1">{post.brief}</p>
                                        </div>
                                        <div className="flex items-center gap-3 shrink-0">
                                            <span className="text-xs text-neutral-400 dark:text-neutral-500">{post.publishedAtHuman}</span>
                                            <span className="text-xs text-neutral-400 dark:text-neutral-500">{post.readTimeLabel}</span>
                                        </div>
                                    </div>
                                </Link>
                            )) : (
                                <div className="px-4 sm:px-6 py-8 text-center text-sm text-neutral-500 dark:text-neutral-400">
                                    No published posts yet.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Draft Posts */}
                    <div className="bg-white dark:bg-neutral-800 shadow-sm sm:rounded-lg border border-neutral-200 dark:border-neutral-700">
                        <div className="px-4 sm:px-6 py-4 border-b border-neutral-200 dark:border-neutral-700">
                            <h3 className="text-lg font-semibold text-amber-600 dark:text-amber-400">Draft Posts</h3>
                        </div>
                        <div className="divide-y divide-neutral-200 dark:divide-neutral-700">
                            {draftPostsList.length > 0 ? draftPostsList.map((post) => (
                                <div
                                    key={post.slug}
                                    className="px-4 sm:px-6 py-4"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-medium text-neutral-900 dark:text-white">{post.title}</p>
                                            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 line-clamp-1">{post.brief}</p>
                                            <div className="flex items-center gap-3 mt-1.5">
                                                <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">{post.readTimeLabel}</span>
                                                {post.draftPreviewUrl && (
                                                    <a
                                                        href={post.draftPreviewUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                                                    >
                                                        Preview
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )) : (
                                <div className="px-4 sm:px-6 py-8 text-center text-sm text-neutral-500 dark:text-neutral-400">
                                    No draft posts.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-white dark:bg-neutral-800 shadow-sm sm:rounded-lg border border-neutral-200 dark:border-neutral-700">
                        <div className="px-4 sm:px-6 py-4 border-b border-neutral-200 dark:border-neutral-700">
                            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">Quick Actions</h3>
                        </div>
                        <div className="px-4 sm:px-6 py-4">
                            <Link
                                href="/admin"
                                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                View All Posts
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
