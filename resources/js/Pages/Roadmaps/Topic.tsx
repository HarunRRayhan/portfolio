import { Link, router } from '@inertiajs/react'
import { useEffect, useState } from 'react'
import { ArrowLeft, ArrowRight, Check, ChevronRight, Lock, Share2 } from 'lucide-react'
import { ShareButton } from '@/Components/ShareButton'
import { Comments, type RoadmapComment } from '@/Components/Roadmap/Comments'
import { type Lesson, OptionalTag, ProgressBar, ResourceList, UnlockCard, lessonLetter, levelLabel } from '@/Components/Roadmap/shared'
import { cn } from '@/lib/utils'

type Props = {
  roadmap: { slug: string; title: string }
  topic: { id: string; number: number; title: string; summary: string; level: string; stageTitle: string }
  lessons: Lesson[]
  locked: boolean
  hasAccount: boolean
  percent: number
  prev: { id: string; title: string } | null
  next: { id: string; title: string } | null
  canonicalUrl: string
  comments: RoadmapComment[]
  commentCount: number
}

export default function RoadmapTopic({ roadmap, topic, lessons, locked, hasAccount, percent, prev, next, canonicalUrl, comments, commentCount }: Props) {
  const base = `/roadmaps/${roadmap.slug}`
  const here = `${base}/${topic.id}`
  const loginHref = `/login?redirect=${encodeURIComponent(here)}`
  const [tab, setTab] = useState<'overview' | 'resources'>('overview')
  useEffect(() => {
    if (window.location.hash === '#resources') setTab('resources') // after hydration, so SSR markup matches
  }, [])
  const learn = lessons.flatMap((l) => l.learn ?? [])
  const resourceCount = lessons.reduce((n, l) => n + (l.resources?.length ?? 0), 0)
  const pick = (t: typeof tab) => {
    setTab(t)
    history.replaceState(history.state, '', t === 'resources' ? '#resources' : window.location.pathname + window.location.search)
  }

  const toggle = (lesson: Lesson) => {
    if (!hasAccount) {
      router.visit(loginHref)
      return
    }
    router[lesson.done ? 'delete' : 'post'](`${base}/lessons/${lesson.id}`, {}, { preserveScroll: true })
  }

  return (
    <div className="pt-24">
      <section className="mx-auto max-w-3xl px-4 pb-24 pt-8 sm:px-6 lg:px-8">
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-sm text-slate-500">
          <Link href="/roadmaps" className="hover:text-slate-800 dark:hover:text-slate-200">Roadmaps</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link href={`${base}#${topic.id}`} className="hover:text-slate-800 dark:hover:text-slate-200">{roadmap.title}</Link>
        </nav>

        <p className="mt-6 text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
          {levelLabel[topic.level]} · {topic.stageTitle}
        </p>
        <h1 className="mt-2 flex items-center gap-3 text-4xl font-semibold tracking-tight text-slate-950 dark:text-white">
          <span className="inline-flex h-11 min-w-11 items-center justify-center rounded-xl bg-amber-500 px-2 text-xl font-bold text-amber-950">{topic.number}</span>
          {topic.title}
        </h1>
        <p className="mt-3 text-lg leading-8 text-slate-600 dark:text-slate-300">{topic.summary}</p>

        <div className="mt-6 flex flex-wrap items-center gap-4">
          {hasAccount && !locked && (
            <div className="flex min-w-[12rem] flex-1 items-center gap-3">
              <ProgressBar percent={percent} />
              <span className="text-sm tabular-nums text-slate-600 dark:text-slate-300">{percent}%</span>
            </div>
          )}
          <ShareButton
            url={canonicalUrl}
            title={`${topic.title} · ${roadmap.title}`}
            shareTitle={`${topic.title} · ${roadmap.title} roadmap`}
            label={`Share ${topic.title}`}
            triggerClassName="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <Share2 className="h-4 w-4" /> Share
          </ShareButton>
        </div>

        {!hasAccount && !locked && (
          <p className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
            <Link href={loginHref} className="font-semibold underline underline-offset-2">Sign in or create a free account</Link> to tick off lessons and track your progress.
          </p>
        )}

        {locked && <UnlockCard className="mt-8" />}

        <div role="tablist" aria-label="Topic sections" className="mt-10 inline-flex rounded-full border border-slate-200 p-1 dark:border-slate-800">
          {(['overview', 'resources'] as const).map((t) => (
            <button
              key={t}
              role="tab"
              id={`tab-${t}`}
              aria-selected={tab === t}
              aria-controls={`panel-${t}`}
              onClick={() => pick(t)}
              className={cn('rounded-full px-4 py-1.5 text-sm font-medium', tab === t ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'text-slate-600 hover:text-slate-900 dark:text-slate-300')}
            >
              {t === 'overview' ? 'Overview' : `Resources${resourceCount ? ` (${resourceCount})` : ''}`}
            </button>
          ))}
        </div>

        {tab === 'resources' ? (
          <div role="tabpanel" id="panel-resources" aria-labelledby="tab-resources" className="mt-6 space-y-6">
            {locked ? (
              <p className="text-sm text-slate-600 dark:text-slate-300">Unlock this level to see where to learn each lesson from.</p>
            ) : (
              lessons.filter((l) => l.resources?.length).map((lesson) => (
                <section key={lesson.id}>
                  <h3 className="font-semibold text-slate-900 dark:text-white">
                    <Link href={`${here}/${lesson.id}`} className="hover:underline">{lessonLetter(lessons.indexOf(lesson))}. {lesson.title}</Link>
                  </h3>
                  <ResourceList resources={lesson.resources!} />
                </section>
              ))
            )}
          </div>
        ) : (
        <div role="tabpanel" id="panel-overview" aria-labelledby="tab-overview">
        {learn.length > 0 && (
          <>
            <h2 className="mt-8 text-sm font-semibold uppercase tracking-wider text-slate-500">What you'll learn</h2>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {learn.map((item, i) => (
                <li key={i} className="flex gap-2 text-sm text-slate-700 dark:text-slate-300">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden />{item}
                </li>
              ))}
            </ul>
          </>
        )}

        <h2 className="mt-8 text-sm font-semibold uppercase tracking-wider text-slate-500">Lessons</h2>
        <ol className="mt-3 divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
          {lessons.map((lesson, i) => (
            <li key={lesson.id} id={lesson.id} className="flex items-center gap-3 px-4 py-3">
              {locked ? (
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-slate-300 dark:border-slate-600">
                  <Lock className="h-3 w-3 text-slate-400" />
                </span>
              ) : (
                <button
                  onClick={() => toggle(lesson)}
                  aria-pressed={lesson.done}
                  aria-label={`Mark "${lesson.title}" ${lesson.done ? 'not done' : 'done'}`}
                  className={cn('flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2', lesson.done ? 'border-amber-500 bg-amber-500 text-amber-950' : 'border-slate-300 hover:border-amber-500 dark:border-slate-600')}
                >
                  {lesson.done && <Check className="h-3.5 w-3.5" />}
                </button>
              )}
              <Link href={`${here}/${lesson.id}`} className="min-w-0 flex-1 text-left">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-md bg-slate-100 px-1.5 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">{lessonLetter(i)}</span>
                  <span className={cn('font-semibold', lesson.done ? 'text-slate-500 line-through decoration-amber-500/60' : 'text-slate-900 dark:text-white')}>{lesson.title}</span>
                  {lesson.optional && <OptionalTag />}
                </span>
                {lesson.summary && <span className="mt-1 block text-sm text-slate-500 dark:text-slate-400">{lesson.summary}</span>}
              </Link>
              <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
            </li>
          ))}
        </ol>
        </div>
        )}

        <nav className="mt-10 grid gap-3 sm:grid-cols-2" aria-label="Topics">
          {prev ? (
            <Link href={`${base}/${prev.id}`} className="rounded-xl border border-slate-200 p-4 hover:border-amber-400 dark:border-slate-800">
              <span className="inline-flex items-center gap-1 text-xs text-slate-500"><ArrowLeft className="h-3.5 w-3.5" /> Previous topic</span>
              <span className="mt-1 block font-semibold text-slate-900 dark:text-white">{prev.title}</span>
            </Link>
          ) : <span />}
          {next && (
            <Link href={`${base}/${next.id}`} className="rounded-xl border border-slate-200 p-4 text-right hover:border-amber-400 dark:border-slate-800">
              <span className="inline-flex items-center gap-1 text-xs text-slate-500">Next topic <ArrowRight className="h-3.5 w-3.5" /></span>
              <span className="mt-1 block font-semibold text-slate-900 dark:text-white">{next.title}</span>
            </Link>
          )}
        </nav>

        {!locked && <Comments comments={comments} count={commentCount} postUrl={`${here}/comments`} loginHref={loginHref} />}
      </section>

    </div>
  )
}
