import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { ArrowRight, BarChart3, FileText, Link2 } from 'lucide-react';

interface Props {
    bioClicks: number;
    shortClicks: number;
    bioLinks: number;
    shortLinks: number;
    blogViews: number;
}

export default function Analytics({ bioClicks, shortClicks, bioLinks, shortLinks, blogViews }: Props) {
    return (
        <AuthenticatedLayout header={<h1 className="text-xl font-semibold text-foreground">Analytics</h1>}>
            <Head title="Analytics" />
            <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
                <div>
                    <h2 className="text-2xl font-semibold text-foreground">Your activity at a glance</h2>
                    <p className="mt-1 text-sm text-muted-foreground">Link clicks from the last 30 days, plus all-time blog views. Open a link report for daily activity, sources, and locations.</p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                    <Link href={route('admin.bio.analytics')}
                        className="group rounded-lg border bg-background p-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary hover:border-primary/50">
                        <div className="flex items-center justify-between gap-4">
                            <span className="flex items-center gap-2 text-sm font-medium text-foreground"><BarChart3 className="h-4 w-4" />Bio page</span>
                            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                        </div>
                        <p className="mt-5 text-3xl font-semibold tabular-nums text-foreground">{bioClicks.toLocaleString()}</p>
                        <p className="mt-1 text-sm text-muted-foreground">bio link clicks across {bioLinks.toLocaleString()} links</p>
                        <span className="mt-5 inline-block text-sm font-medium text-primary">View bio analytics</span>
                    </Link>
                    <Link href={route('admin.short.analytics')}
                        className="group rounded-lg border bg-background p-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary hover:border-primary/50">
                        <div className="flex items-center justify-between gap-4">
                            <span className="flex items-center gap-2 text-sm font-medium text-foreground"><Link2 className="h-4 w-4" />Short links</span>
                            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                        </div>
                        <p className="mt-5 text-3xl font-semibold tabular-nums text-foreground">{shortClicks.toLocaleString()}</p>
                        <p className="mt-1 text-sm text-muted-foreground">short link clicks across {shortLinks.toLocaleString()} links</p>
                        <span className="mt-5 inline-block text-sm font-medium text-primary">View short link analytics</span>
                    </Link>
                </div>
                <div className="flex items-start gap-3 rounded-lg border bg-background p-5">
                    <FileText className="mt-0.5 h-5 w-5 text-muted-foreground" />
                    <div>
                        <h3 className="text-sm font-semibold text-foreground">Blog views · all time</h3>
                        <p className="mt-2 text-2xl font-semibold tabular-nums text-foreground">{blogViews.toLocaleString()}</p>
                        <p className="mt-1 text-sm text-muted-foreground">See views for each published post.</p>
                        <Link href={route('admin.posts.analytics')} className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">View post analytics <ArrowRight className="h-4 w-4" /></Link>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
