import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { BarChart3, ExternalLink, FileText, Search } from 'lucide-react';
import { useMemo, useState } from 'react';

interface Post {
    title: string;
    slug: string;
    brief: string;
    publishedAtHuman: string;
    readTimeLabel: string;
    url: string;
    isDraft: boolean;
    draftPreviewUrl: string | null;
    viewCount: number;
}

interface Props {
    stats: { totalPosts: number; publishedPosts: number; draftPosts: number; totalViews: number };
    posts: Post[];
}

type Filter = 'all' | 'published' | 'draft';

export default function PostsIndex({ stats, posts }: Props) {
    const [filter, setFilter] = useState<Filter>('all');
    const [query, setQuery] = useState('');
    const visiblePosts = useMemo(() => posts.filter((post) => {
        if (filter === 'published' && post.isDraft) return false;
        if (filter === 'draft' && !post.isDraft) return false;
        const search = query.trim().toLowerCase();
        return !search || `${post.title} ${post.brief}`.toLowerCase().includes(search);
    }), [posts, filter, query]);

    return (
        <AuthenticatedLayout header={<h1 className="text-xl font-semibold text-foreground">Posts</h1>}>
            <Head title="Posts" />
            <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-semibold text-foreground">All posts</h2>
                        <p className="mt-1 text-sm text-muted-foreground">Published posts and drafts in one place.</p>
                    </div>
                    <Link href={route('admin.posts.analytics')}
                        className="inline-flex items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm font-medium text-foreground hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">
                        <BarChart3 className="h-4 w-4" />Post analytics
                    </Link>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {[
                        ['All posts', stats.totalPosts],
                        ['Published', stats.publishedPosts],
                        ['Drafts', stats.draftPosts],
                        ['All-time views', stats.totalViews],
                    ].map(([label, value]) => (
                        <div key={label} className="rounded-lg border bg-background p-4">
                            <p className="text-xs font-medium text-muted-foreground">{label}</p>
                            <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">{Number(value).toLocaleString()}</p>
                        </div>
                    ))}
                </div>

                <div className="overflow-hidden rounded-lg border bg-background">
                    <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex gap-1" aria-label="Filter posts">
                            {(['all', 'published', 'draft'] as const).map((option) => (
                                <button key={option} type="button" aria-pressed={filter === option} onClick={() => setFilter(option)}
                                    className={'rounded-md px-3 py-1.5 text-sm font-medium capitalize focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ' +
                                        (filter === option ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground')}>
                                    {option === 'all' ? 'All' : option === 'draft' ? 'Drafts' : 'Published'}
                                </button>
                            ))}
                        </div>
                        <label className="relative block sm:w-64">
                            <span className="sr-only">Search posts</span>
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search posts"
                                className="w-full rounded-md border bg-background py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
                        </label>
                    </div>
                    <div className="divide-y">
                        {visiblePosts.length ? visiblePosts.map((post) => {
                            const destination = post.isDraft ? post.draftPreviewUrl : post.url;
                            return (
                                <div key={post.slug} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h3 className="text-sm font-semibold text-foreground">{post.title}</h3>
                                            <span className={'rounded px-1.5 py-0.5 text-xs font-medium ' + (post.isDraft
                                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                                : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300')}>
                                                {post.isDraft ? 'Draft' : 'Published'}
                                            </span>
                                        </div>
                                        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{post.brief}</p>
                                        <p className="mt-2 text-xs text-muted-foreground">
                                            {post.isDraft ? 'Draft' : post.publishedAtHuman} · {post.readTimeLabel}
                                            {!post.isDraft && <> · {post.viewCount.toLocaleString()} views</>}
                                        </p>
                                    </div>
                                    {destination && <a href={destination} target="_blank" rel="noopener noreferrer"
                                        className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-primary hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">
                                        {post.isDraft ? 'Preview' : 'View post'}<ExternalLink className="h-3.5 w-3.5" />
                                    </a>}
                                </div>
                            );
                        }) : (
                            <div className="flex flex-col items-center gap-2 px-4 py-12 text-center text-muted-foreground">
                                <FileText className="h-6 w-6" />
                                <p className="text-sm">{filter === 'draft' && stats.draftPosts === 0
                                    ? 'No draft posts.'
                                    : query ? 'No posts match your search.' : 'No posts in this view.'}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
