import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { BarChart3, ChevronLeft, ChevronRight, ExternalLink, FileText, Search } from 'lucide-react';
import { useMemo, useState } from 'react';

interface Post {
    title: string;
    slug: string;
    brief: string;
    publishedAtHuman: string;
    readTimeLabel: string;
    url: string;
    isDraft: boolean;
    isScheduled: boolean;
    canSchedule: boolean;
    scheduledForHuman: string | null;
    calendarDate: string | null;
    calendarTime: string | null;
    draftPreviewUrl: string | null;
    viewCount: number;
}

interface Props {
    stats: { totalPosts: number; publishedPosts: number; draftPosts: number; totalViews: number };
    posts: Post[];
    scheduleTimezone: string;
    today: string;
}

type Filter = 'all' | 'published' | 'scheduled' | 'draft';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function monthParts(date: string): { year: number; month: number } {
    const [year, month] = date.split('-').map(Number);

    return { year, month: month - 1 };
}

function dateKey(year: number, month: number, day: number): string {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function dayLabel(key: string): string {
    const [year, month, day] = key.split('-').map(Number);
    const weekday = WEEKDAYS[new Date(Date.UTC(year, month - 1, day)).getUTCDay()];

    return `${weekday}, ${MONTHS[month - 1].slice(0, 3)} ${day}, ${year}`;
}

function PostCalendar({ posts, timezone, today }: { posts: Post[]; timezone: string; today: string }) {
    const start = monthParts(today);
    const [cursor, setCursor] = useState(start);
    const [selected, setSelected] = useState(today);
    const byDate = useMemo(() => {
        const map = new Map<string, Post[]>();
        posts.forEach((post) => {
            if (!post.calendarDate) return;
            map.set(post.calendarDate, [...(map.get(post.calendarDate) ?? []), post]);
        });

        return map;
    }, [posts]);
    const daysInMonth = new Date(Date.UTC(cursor.year, cursor.month + 1, 0)).getUTCDate();
    const leadingBlankDays = new Date(Date.UTC(cursor.year, cursor.month, 1)).getUTCDay();
    const cells = [
        ...Array.from({ length: leadingBlankDays }, () => null),
        ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
    ];
    const selectedPosts = byDate.get(selected) ?? [];
    const viewingToday = cursor.year === start.year && cursor.month === start.month;

    function shiftMonth(delta: number) {
        const next = new Date(Date.UTC(cursor.year, cursor.month + delta, 1));
        const year = next.getUTCFullYear();
        const month = next.getUTCMonth();
        setCursor({ year, month });
        setSelected(year === start.year && month === start.month ? today : dateKey(year, month, 1));
    }

    return (
        <section id="calendar" className="overflow-hidden rounded-lg border bg-background" aria-labelledby="post-calendar-heading">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4">
                <div>
                    <h2 id="post-calendar-heading" className="text-lg font-semibold text-foreground">Calendar</h2>
                    <p className="mt-1 text-sm text-muted-foreground">Published posts and scheduled drafts, in {timezone}.</p>
                </div>
                <div className="flex items-center gap-2">
                    <button type="button" onClick={() => shiftMonth(-1)} aria-label="Previous month"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md border text-foreground hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">
                        <ChevronLeft className="h-4 w-4" />
                    </button>
                    <p className="min-w-36 text-center text-sm font-medium text-foreground">{MONTHS[cursor.month]} {cursor.year}</p>
                    <button type="button" onClick={() => shiftMonth(1)} aria-label="Next month"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md border text-foreground hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">
                        <ChevronRight className="h-4 w-4" />
                    </button>
                    {!viewingToday && (
                        <button type="button" onClick={() => { setCursor(start); setSelected(today); }}
                            className="rounded-md border px-2 py-1 text-sm font-medium text-foreground hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">
                            Today
                        </button>
                    )}
                </div>
            </div>
            <div className="flex gap-4 px-4 pt-3 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" />Published</span>
                <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-sky-500" />Scheduled</span>
            </div>
            <div className="grid grid-cols-7 gap-px bg-border p-px" role="grid" aria-label={`${MONTHS[cursor.month]} ${cursor.year}`}>
                {WEEKDAYS.map((day) => (
                    <div key={day} className="bg-background px-1 py-2 text-center text-[11px] font-medium text-muted-foreground">{day}</div>
                ))}
                {cells.map((day, index) => {
                    if (day === null) {
                        return <div key={`blank-${index}`} className="min-h-14 bg-muted/30 sm:min-h-20" />;
                    }
                    const key = dateKey(cursor.year, cursor.month, day);
                    const dayPosts = byDate.get(key) ?? [];
                    const isSelected = key === selected;
                    const isToday = key === today;

                    return (
                        <button key={key} type="button" role="gridcell" aria-pressed={isSelected} aria-label={`${MONTHS[cursor.month]} ${day}, ${dayPosts.length} ${dayPosts.length === 1 ? 'post' : 'posts'}`}
                            onClick={() => setSelected(key)}
                            className={'min-h-14 bg-background p-1 text-left hover:bg-muted/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary sm:min-h-20 sm:p-1.5 ' + (isSelected ? 'ring-2 ring-inset ring-primary' : '')}>
                            <span className={'inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-medium ' + (isToday ? 'bg-primary text-primary-foreground' : 'text-foreground')}>{day}</span>
                            <span className="mt-1 flex gap-1 sm:hidden" aria-hidden="true">
                                {dayPosts.some((post) => !post.isScheduled) && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />}
                                {dayPosts.some((post) => post.isScheduled) && <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />}
                            </span>
                            <span className="mt-1 hidden space-y-0.5 sm:block">
                                {dayPosts.slice(0, 2).map((post) => (
                                    <span key={post.slug} className={'block truncate rounded px-1 text-[10px] leading-4 ' + (post.isScheduled ? 'bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-200' : 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200')}>
                                        {post.title}
                                    </span>
                                ))}
                                {dayPosts.length > 2 && <span className="block px-1 text-[10px] text-muted-foreground">+{dayPosts.length - 2}</span>}
                            </span>
                        </button>
                    );
                })}
            </div>
            <div className="border-t p-4">
                <h3 className="text-sm font-semibold text-foreground">{dayLabel(selected)}</h3>
                {selectedPosts.length ? (
                    <ul className="mt-2 divide-y">
                        {selectedPosts.map((post) => (
                            <li key={post.slug} className="flex items-start justify-between gap-3 py-2">
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-medium text-foreground">{post.title}</p>
                                    <p className="text-xs text-muted-foreground">{post.calendarTime} · {post.isScheduled ? 'Scheduled' : 'Published'}</p>
                                </div>
                                <span className={'shrink-0 rounded px-1.5 py-0.5 text-xs font-medium ' + (post.isScheduled ? 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300')}>
                                    {post.isScheduled ? 'Scheduled' : 'Published'}
                                </span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="mt-2 text-sm text-muted-foreground">Nothing published or scheduled on this day.</p>
                )}
            </div>
        </section>
    );
}

function ScheduleForm({ slug, timezone, scheduled }: { slug: string; timezone: string; scheduled: boolean }) {
    const form = useForm({ publish_at: '' });

    return (
        <form
            className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end"
            onSubmit={(event) => {
                event.preventDefault();
                form.post(route('admin.posts.schedule', slug));
            }}
        >
            <label className="block text-xs font-medium text-muted-foreground">
                Goes live ({timezone})
                <input
                    type="datetime-local"
                    required
                    value={form.data.publish_at}
                    onChange={(event) => form.setData('publish_at', event.target.value)}
                    className="mt-1 block w-full rounded-md border bg-background px-2 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary sm:w-56"
                />
            </label>
            <button
                type="submit"
                disabled={form.processing}
                className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-60"
            >
                {scheduled ? 'Reschedule' : 'Schedule'}
            </button>
            {form.errors.publish_at && <p className="text-xs text-red-600 dark:text-red-400">{form.errors.publish_at}</p>}
        </form>
    );
}

export default function PostsIndex({ stats, posts, scheduleTimezone, today }: Props) {
    const [filter, setFilter] = useState<Filter>('all');
    const [query, setQuery] = useState('');
    const visiblePosts = useMemo(() => posts.filter((post) => {
        if (filter === 'published' && post.isDraft) return false;
        if (filter === 'scheduled' && !post.isScheduled) return false;
        if (filter === 'draft' && (!post.isDraft || post.isScheduled)) return false;
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
                        <p className="mt-1 text-sm text-muted-foreground">Schedule a draft and it goes live at that time.</p>
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

                <PostCalendar posts={posts} timezone={scheduleTimezone} today={today} />

                <div className="overflow-hidden rounded-lg border bg-background">
                    <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex gap-1" aria-label="Filter posts">
                            {(['all', 'published', 'scheduled', 'draft'] as const).map((option) => (
                                <button key={option} type="button" aria-pressed={filter === option} onClick={() => setFilter(option)}
                                    className={'rounded-md px-3 py-1.5 text-sm font-medium capitalize focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ' +
                                        (filter === option ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground')}>
                                    {option === 'all' ? 'All' : option === 'draft' ? 'Drafts' : option === 'scheduled' ? 'Scheduled' : 'Published'}
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
                                            <span className={'rounded px-1.5 py-0.5 text-xs font-medium ' + (post.isScheduled
                                                ? 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300'
                                                : post.isDraft
                                                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                                    : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300')}>
                                                {post.isScheduled ? 'Scheduled' : post.isDraft ? 'Draft' : 'Published'}
                                            </span>
                                        </div>
                                        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{post.brief}</p>
                                        <p className="mt-2 text-xs text-muted-foreground">
                                            {post.isScheduled ? `Scheduled for ${post.scheduledForHuman} ${scheduleTimezone}` : post.isDraft ? 'Draft' : post.publishedAtHuman} · {post.readTimeLabel}
                                            {!post.isDraft && <> · {post.viewCount.toLocaleString()} views</>}
                                        </p>
                                        {post.canSchedule && (
                                            <ScheduleForm slug={post.slug} timezone={scheduleTimezone} scheduled={post.isScheduled} />
                                        )}
                                        {post.canSchedule && (
                                            <p className="mt-2 text-xs text-muted-foreground">
                                                When it goes live, IndexNow hears about it. Google reads the new URL from the sitemap.
                                            </p>
                                        )}
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
                                    : filter === 'scheduled' && !query ? 'No scheduled posts.'
                                    : query ? 'No posts match your search.' : 'No posts in this view.'}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
