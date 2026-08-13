import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { Head, Link } from '@inertiajs/react';
import { getImageUrl } from "@/lib/imageUtils";
import {
    Area,
    AreaChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import {
    ArrowUpRight,
    CalendarDays,
    CheckCircle2,
    ChevronRight,
    Clock,
    ExternalLink,
    Eye,
    FileText,
    Image as ImageIcon,
    Inbox,
    KeyRound,
    Link2,
    PenLine,
    TrendingUp,
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
        iconClassName: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
        accentClassName: 'bg-slate-300 dark:bg-slate-600',
    },
    {
        label: 'Published',
        value: stats.publishedPosts,
        icon: CheckCircle2,
        iconClassName: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400',
        accentClassName: 'bg-emerald-500',
    },
    {
        label: 'Drafts',
        value: stats.draftPosts,
        icon: PenLine,
        iconClassName: 'bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400',
        accentClassName: 'bg-amber-500',
    },
    {
        label: 'Preview Ready',
        value: stats.previewReadyDrafts,
        icon: Eye,
        iconClassName: 'bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400',
        accentClassName: 'bg-blue-500',
    },
];

const quickActions = [
    { label: 'View All Posts', href: '/admin', icon: FileText },
    { label: 'Short Links', href: '/admin/short', icon: Link2 },
    { label: 'Slides & Videos', href: '/admin/media', icon: ImageIcon },
    { label: 'API Keys', href: '/admin/api-keys', icon: KeyRound },
];

function CountBadge({ value }: { value: number }) {
    return (
        <span className="inline-flex h-6 min-w-6 shrink-0 items-center justify-center rounded-full bg-muted px-2 text-xs font-medium tabular-nums text-muted-foreground">
            {value}
        </span>
    );
}

function EmptyState({ icon: Icon, message }: { icon: typeof Inbox; message: string }) {
    return (
        <div className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <Icon className="h-5 w-5" />
            </span>
            <p className="text-sm text-muted-foreground">{message}</p>
        </div>
    );
}

export default function Dashboard({ stats, panelStatus, panelStatusDetail, recentPosts, draftPostsList, postsTrend }: Props) {
    const trendTotal = postsTrend.reduce((sum, point) => sum + point.count, 0);

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center gap-3">
                    <h2 className="text-xl font-semibold leading-tight text-foreground">
                        Dashboard
                    </h2>
                    <span
                        title={panelStatusDetail}
                        className="hidden items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 sm:inline-flex dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-400"
                    >
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        {panelStatus}
                    </span>
                </div>
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

            <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
                {/* Stats Cards */}
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                    {statCards(stats).map((stat) => {
                        const Icon = stat.icon;

                        return (
                            <Card key={stat.label} className="relative overflow-hidden transition-shadow hover:shadow-md">
                                <span className={`absolute inset-x-0 top-0 h-0.5 ${stat.accentClassName}`} aria-hidden="true" />
                                <CardContent className="flex items-start justify-between gap-3 p-4 pt-4 sm:p-5 sm:pt-5">
                                    <div className="min-w-0">
                                        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                            {stat.label}
                                        </p>
                                        <p className="mt-2 text-2xl font-semibold tabular-nums leading-none text-foreground sm:text-3xl">
                                            {stat.value}
                                        </p>
                                    </div>
                                    <span className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${stat.iconClassName}`}>
                                        <Icon className="h-[18px] w-[18px]" />
                                    </span>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Posts Published trend */}
                    <Card className="lg:col-span-2">
                        <CardHeader className="flex-row items-start justify-between gap-4 space-y-0 border-b p-5">
                            <div className="space-y-1">
                                <CardTitle className="text-base font-semibold">Posts Published</CardTitle>
                                <CardDescription>Published posts per month, last 6 months</CardDescription>
                            </div>
                            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                                <TrendingUp className="h-3.5 w-3.5" />
                                <span className="tabular-nums">{trendTotal}</span>
                                in 6 mo
                            </span>
                        </CardHeader>
                        <CardContent className="h-64 p-5 pl-1">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={postsTrend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="postsTrendFill" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid
                                        vertical={false}
                                        strokeDasharray="3 3"
                                        stroke="hsl(var(--border))"
                                    />
                                    <XAxis
                                        dataKey="label"
                                        axisLine={false}
                                        tickLine={false}
                                        tickMargin={8}
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
                                        cursor={{ stroke: 'hsl(var(--border))', strokeWidth: 1 }}
                                        contentStyle={{
                                            backgroundColor: 'hsl(var(--card))',
                                            borderColor: 'hsl(var(--border))',
                                            borderRadius: 8,
                                            fontSize: 12,
                                            boxShadow: '0 4px 12px rgb(0 0 0 / 0.08)',
                                        }}
                                        labelStyle={{ color: 'hsl(var(--foreground))' }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="count"
                                        stroke="hsl(var(--primary))"
                                        strokeWidth={2}
                                        fill="url(#postsTrendFill)"
                                        activeDot={{ r: 4, strokeWidth: 2, stroke: 'hsl(var(--card))' }}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Quick Actions */}
                    <Card>
                        <CardHeader className="space-y-1 border-b p-5">
                            <CardTitle className="text-base font-semibold">Manage</CardTitle>
                            <CardDescription>Quick shortcuts to the rest of the admin area</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2 p-3">
                            {quickActions.map((action) => {
                                const Icon = action.icon;

                                return (
                                    <Link
                                        key={action.label}
                                        href={action.href}
                                        className="group flex items-center gap-3 rounded-lg border border-transparent px-3 py-2.5 transition-colors hover:border-border hover:bg-muted/60"
                                    >
                                        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                            <Icon className="h-[18px] w-[18px]" />
                                        </span>
                                        <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                                            {action.label}
                                        </span>
                                        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
                                    </Link>
                                );
                            })}
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Recent Published Posts */}
                    <Card className="flex flex-col">
                        <CardHeader className="flex-row items-center justify-between gap-4 space-y-0 border-b p-5">
                            <div className="flex items-center gap-2.5">
                                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                                    <CheckCircle2 className="h-4 w-4" />
                                </span>
                                <CardTitle className="text-base font-semibold">Recent Published Posts</CardTitle>
                            </div>
                            <CountBadge value={recentPosts.length} />
                        </CardHeader>
                        <CardContent className="flex-1 divide-y p-0">
                            {recentPosts.length > 0 ? recentPosts.map((post) => (
                                <a
                                    key={post.slug}
                                    href={post.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group flex items-start gap-3 px-4 py-3.5 transition-colors hover:bg-muted/50 sm:px-5"
                                >
                                    {post.coverImageUrl ? (
                                        <img
                                            src={getImageUrl(post.coverImageUrl)}
                                            alt=""
                                            loading="lazy"
                                            className="h-12 w-16 shrink-0 rounded-md border object-cover"
                                        />
                                    ) : (
                                        <span className="inline-flex h-12 w-16 shrink-0 items-center justify-center rounded-md border bg-muted text-muted-foreground">
                                            <FileText className="h-4 w-4" />
                                        </span>
                                    )}

                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-medium text-foreground group-hover:text-primary">
                                            {post.title}
                                        </p>
                                        <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{post.brief}</p>
                                        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                                            <span className="inline-flex items-center gap-1">
                                                <CalendarDays className="h-3.5 w-3.5" />
                                                {post.publishedAtHuman}
                                            </span>
                                            <span className="inline-flex items-center gap-1">
                                                <Clock className="h-3.5 w-3.5" />
                                                {post.readTimeLabel}
                                            </span>
                                        </div>
                                    </div>

                                    <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                                </a>
                            )) : (
                                <EmptyState icon={Inbox} message="No published posts yet." />
                            )}
                        </CardContent>
                    </Card>

                    {/* Draft Posts */}
                    <Card className="flex flex-col">
                        <CardHeader className="flex-row items-center justify-between gap-4 space-y-0 border-b p-5">
                            <div className="flex items-center gap-2.5">
                                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400">
                                    <PenLine className="h-4 w-4" />
                                </span>
                                <CardTitle className="text-base font-semibold">Draft Posts</CardTitle>
                            </div>
                            <CountBadge value={draftPostsList.length} />
                        </CardHeader>
                        <CardContent className="flex-1 divide-y p-0">
                            {draftPostsList.length > 0 ? draftPostsList.map((post) => (
                                <div
                                    key={post.slug}
                                    className="flex items-start gap-3 px-4 py-3.5 sm:px-5"
                                >
                                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-amber-500" aria-hidden="true" />

                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium text-foreground">{post.title}</p>
                                        <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{post.brief}</p>
                                        <div className="mt-2 flex flex-wrap items-center gap-2">
                                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-950 dark:text-amber-400">
                                                <Clock className="h-3 w-3" />
                                                {post.readTimeLabel}
                                            </span>
                                            {post.draftPreviewUrl && (
                                                <a
                                                    href={post.draftPreviewUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
                                                >
                                                    <ExternalLink className="h-3 w-3" />
                                                    Preview
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )) : (
                                <EmptyState icon={PenLine} message="No draft posts." />
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
