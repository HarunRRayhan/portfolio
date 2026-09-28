import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, ExternalLink } from 'lucide-react';

interface PostViews {
    title: string;
    slug: string;
    url: string;
    views: number;
}

interface Props {
    totalViews: number;
    postsWithViews: number;
    publishedPosts: number;
    posts: PostViews[];
}

export default function PostAnalytics({ totalViews, postsWithViews, publishedPosts, posts }: Props) {
    const maxViews = posts[0]?.views ?? 0;

    return (
        <AuthenticatedLayout header={<h1 className="text-xl font-semibold text-foreground">Post analytics</h1>}>
            <Head title="Post analytics" />
            <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
                <div>
                    <Link href={route('admin.posts.index')} className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
                        <ArrowLeft className="h-4 w-4" />All posts
                    </Link>
                    <h2 className="mt-3 text-2xl font-semibold text-foreground">Post views</h2>
                    <p className="mt-1 text-sm text-muted-foreground">All-time views for published posts. Views are stored as totals, so a daily trend is not available.</p>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                    {[
                        ['Total views', totalViews],
                        ['Posts viewed', postsWithViews],
                        ['Published posts', publishedPosts],
                    ].map(([label, value]) => (
                        <div key={label} className="rounded-lg border bg-background p-5">
                            <p className="text-sm text-muted-foreground">{label}</p>
                            <p className="mt-2 text-3xl font-semibold tabular-nums text-foreground">{Number(value).toLocaleString()}</p>
                        </div>
                    ))}
                </div>

                <div className="overflow-hidden rounded-lg border bg-background">
                    <div className="border-b px-5 py-4">
                        <h3 className="text-base font-semibold text-foreground">Views by post</h3>
                        <p className="mt-1 text-sm text-muted-foreground">Ranked by all-time views.</p>
                    </div>
                    {posts.length ? <div className="divide-y">
                        {posts.map((post, index) => (
                            <div key={post.slug} className="flex items-start gap-4 px-5 py-4">
                                <span className="w-6 shrink-0 pt-0.5 text-right text-xs tabular-nums text-muted-foreground">{index + 1}</span>
                                <div className="min-w-0 flex-1">
                                    <a href={post.url} target="_blank" rel="noopener noreferrer"
                                        className="inline-flex items-start gap-1 text-sm font-medium text-foreground hover:text-primary hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">
                                        {post.title}<ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                    </a>
                                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden="true">
                                        <div className="h-full rounded-full bg-primary" style={{ width: `${maxViews ? (post.views / maxViews) * 100 : 0}%` }} />
                                    </div>
                                </div>
                                <span className="shrink-0 pt-0.5 text-sm font-semibold tabular-nums text-foreground">{post.views.toLocaleString()}</span>
                            </div>
                        ))}
                    </div> : <p className="px-5 py-10 text-center text-sm text-muted-foreground">No published posts yet.</p>}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
