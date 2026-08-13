import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Head, Link } from '@inertiajs/react';
import { getImageUrl } from "@/lib/imageUtils";
import {
    Area,
    AreaChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import {
    CheckCircle2,
    Eye,
    FileText,
    Image as ImageIcon,
    KeyRound,
    Link2,
    PenLine,
} from 'lucide-react';

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

interface PostsTrendPoint {
    label: string;
    count: number;
}

interface Props {
    stats: DashboardStats;
    panelStatus: string;
    panelStatusDetail: string;
    recentPosts: PostSummary[];
    draftPostsList: PostSummary[];
    postsTrend: PostsTrendPoint[];
}

const statCards = (stats: DashboardStats) => [
    {
        label: 'Total Posts',
        value: stats.totalPosts,
        icon: FileText,
        badgeClassName: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
    },
    {
        label: 'Published',
        value: stats.publishedPosts,
        icon: CheckCircle2,
        badgeClassName: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400',
    },
    {
        label: 'Drafts',
        value: stats.draftPosts,
        icon: PenLine,
        badgeClassName: 'bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400',
    },
    {
        label: 'Preview Ready',
        value: stats.previewReadyDrafts,
        icon: Eye,
        badgeClassName: 'bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400',
    },
];

const quickActions = [
    { label: 'View All Posts', href: '/admin', icon: FileText },
    { label: 'Short Links', href: '/admin/short', icon: Link2 },
    { label: 'Slides & Videos', href: '/admin/media', icon: ImageIcon },
    { label: 'API Keys', href: '/admin/api-keys', icon: KeyRound },
];

export default function Dashboard({ stats, recentPosts, draftPostsList, postsTrend }: Props) {
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
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
                    {/* Posts Published trend */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base font-semibold">Posts Published</CardTitle>
                            <p className="text-sm text-muted-foreground">Published posts per month, last 6 months</p>
                        </CardHeader>
                        <CardContent className="h-64 pl-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={postsTrend} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="postsTrendFill" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis
                                        dataKey="label"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                                    />
                                    <YAxis
                                        allowDecimals={false}
                                        axisLine={false}
                                        tickLine={false}
                                        width={28}
                                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'hsl(var(--card))',
                                            borderColor: 'hsl(var(--border))',
                                            borderRadius: 8,
                                            fontSize: 12,
                                        }}
                                        labelStyle={{ color: 'hsl(var(--foreground))' }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="count"
                                        stroke="hsl(var(--primary))"
                                        strokeWidth={2}
                                        fill="url(#postsTrendFill)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {statCards(stats).map((stat) => {
                            const Icon = stat.icon;

                            return (
                                <Card key={stat.label}>
                                    <CardContent className="p-4 sm:p-6">
                                        <div className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${stat.badgeClassName}`}>
                                            <Icon className="h-5 w-5" />
                                        </div>
                                        <p className="text-2xl sm:text-3xl font-semibold text-foreground mt-3">{stat.value}</p>
                                        <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>

                    {/* Recent Published Posts */}
                    <Card>
                        <CardHeader className="border-b">
                            <CardTitle className="text-lg font-semibold">Recent Published Posts</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0 divide-y">
                            {recentPosts.length > 0 ? recentPosts.map((post) => (
                                <Link
                                    key={post.slug}
                                    href={post.url}
                                    className="block px-4 sm:px-6 py-4 hover:bg-muted/50 transition-colors"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-medium text-foreground truncate">{post.title}</p>
                                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{post.brief}</p>
                                        </div>
                                        <div className="flex items-center gap-3 shrink-0">
                                            <span className="text-xs text-muted-foreground">{post.publishedAtHuman}</span>
                                            <span className="text-xs text-muted-foreground">{post.readTimeLabel}</span>
                                        </div>
                                    </div>
                                </Link>
                            )) : (
                                <div className="px-4 sm:px-6 py-8 text-center text-sm text-muted-foreground">
                                    No published posts yet.
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Draft Posts */}
                    <Card>
                        <CardHeader className="border-b">
                            <CardTitle className="text-lg font-semibold text-amber-600 dark:text-amber-400">Draft Posts</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0 divide-y">
                            {draftPostsList.length > 0 ? draftPostsList.map((post) => (
                                <div
                                    key={post.slug}
                                    className="px-4 sm:px-6 py-4"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-medium text-foreground">{post.title}</p>
                                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{post.brief}</p>
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
                                <div className="px-4 sm:px-6 py-8 text-center text-sm text-muted-foreground">
                                    No draft posts.
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Quick Actions */}
                    <Card>
                        <CardHeader className="border-b">
                            <CardTitle className="text-lg font-semibold">Manage</CardTitle>
                            <p className="text-sm text-muted-foreground">Quick shortcuts to the rest of the admin area</p>
                        </CardHeader>
                        <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 sm:p-6">
                            {quickActions.map((action) => {
                                const Icon = action.icon;

                                return (
                                    <Link
                                        key={action.label}
                                        href={action.href}
                                        className="flex flex-col items-center gap-2 rounded-lg border bg-card px-4 py-5 text-center transition-colors hover:bg-muted/50"
                                    >
                                        <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                            <Icon className="h-5 w-5" />
                                        </span>
                                        <span className="text-sm font-medium text-foreground">{action.label}</span>
                                    </Link>
                                );
                            })}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
