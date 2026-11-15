import { Link, router, usePage } from '@inertiajs/react'
import { AlertTriangle, Bookmark, Check, Eye, Heart, Lock, Share2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { ShareButton } from '@/Components/ShareButton'
import { ProgressBar, UnlockCard, formatDate, levelLabel } from '@/Components/Roadmap/shared'
import { RoadmapArt, type RoadmapArtData } from '@/Components/Roadmap/RoadmapArt'
import { cn } from '@/lib/utils'
import type { PageProps } from '@/types'

type TopicNodeData = {
  id: string
  title: string
  summary: string
  lessonCount: number
  requiredCount: number
  doneCount: number
  done: boolean
}

type Stage = { level: string; title: string; locked: boolean; topics: TopicNodeData[] }

type Props = {
  roadmap: { slug: string; title: string; summary: string; buildsOn: { slug: string; title: string } | null; updatedAt: string; art: RoadmapArtData }
  stages: Stage[]
  hasPaidAccess: boolean
  started: boolean
  loved: boolean
  saved: boolean
  loveCount: number
  percent: number
  nextTopicId: string | null
  viewCount: number
  canonicalUrl: string
}

export default function RoadmapShow({ roadmap, stages, started, loved, saved, loveCount, percent, nextTopicId, viewCount, canonicalUrl }: Props) {
  const { auth } = usePage<PageProps>().props
  const base = `/roadmaps/${roadmap.slug}`
  const loginHref = `/login?redirect=${encodeURIComponent(base)}`
  const act = (method: 'post' | 'delete', path: string) => {
    if (!auth?.user) {
      router.visit(loginHref)
      return
    }
    router[method](`${base}${path}`, {}, { preserveScroll: true })
  }

  const [views, setViews] = useState(viewCount)
  useEffect(() => {
    fetch(`${base}/view`, { method: 'POST', headers: { 'X-Requested-With': 'XMLHttpRequest' } })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && typeof d.views === 'number' && setViews(d.views))
      .catch(() => {})
  }, [base])

  return (
    <div className="pt-24">
      <section className="mx-auto max-w-4xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
        <Link href="/roadmaps" className="text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-200">← All roadmaps</Link>
        <RoadmapArt art={roadmap.art} size="hero" className="mt-6" />
        <h1 className="mt-8 text-4xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-5xl">{roadmap.title}</h1>
        <p className="mt-4 text-lg leading-8 text-slate-600 dark:text-slate-300">{roadmap.summary}</p>
        {roadmap.buildsOn && (
          <div className="mt-6 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden />
            <p>
              <strong>Learn {roadmap.buildsOn.title} first.</strong> This roadmap builds on it and assumes you know its basics.{' '}
              <Link href={`/roadmaps/${roadmap.buildsOn.slug}`} className="font-semibold underline underline-offset-2">
                Open the {roadmap.buildsOn.title} roadmap
              </Link>
            </p>
          </div>
        )}

        <div className="mt-8 flex flex-wrap items-center gap-3">
          {!started && (
            <button onClick={() => act('post', '/start')} className="rounded-full bg-amber-500 px-5 py-2.5 text-sm font-semibold text-amber-950 hover:bg-amber-400">
              Start this roadmap
            </button>
          )}
          <button
            onClick={() => act('post', '/love')}
            aria-pressed={loved}
            className={cn('inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium', loved ? 'border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-300' : 'border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800')}
          >
            <Heart className={cn('h-4 w-4', loved && 'fill-current')} /> {loveCount}
            <span className="sr-only">{loved ? 'Remove love' : 'Love this roadmap'}</span>
          </button>
          <button
            onClick={() => act('post', '/wishlist')}
            aria-pressed={saved}
            className={cn('inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium', saved ? 'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300' : 'border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800')}
          >
            <Bookmark className={cn('h-4 w-4', saved && 'fill-current')} /> {saved ? 'Saved' : 'Save for later'}
          </button>
          <ShareButton
            url={canonicalUrl}
            title={`${roadmap.title} roadmap`}
            shareTitle={`${roadmap.title} roadmap`}
            label={`Share the ${roadmap.title} roadmap`}
            triggerClassName="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <Share2 className="h-4 w-4" /> Share
          </ShareButton>
          <span className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
            <Eye className="h-4 w-4" aria-hidden /> {views.toLocaleString()} {views === 1 ? 'view' : 'views'}
          </span>
        </div>

        {!auth?.user && (
          <p className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
            <Link href={loginHref} className="font-semibold underline underline-offset-2">Sign in or create a free account</Link> to tick off topics and track your progress.
          </p>
        )}

        {auth?.user && (
          <div className="mt-6 flex items-center gap-3">
            <ProgressBar percent={percent} />
            <span className="text-sm tabular-nums text-slate-600 dark:text-slate-300">{percent}%</span>
          </div>
        )}

        <p className="mt-10 text-sm text-slate-500 dark:text-slate-400">Click a topic to see its lessons and resources.</p>
      </section>

      <section className="relative mx-auto max-w-5xl px-4 pb-24 sm:px-6 lg:px-8">
        {/* The spine: left edge on phones, centre from md up. */}
        <div aria-hidden className="absolute bottom-24 left-[2.1rem] top-0 w-0.5 bg-slate-300 sm:left-[2.6rem] md:left-1/2 md:-translate-x-1/2 dark:bg-slate-700" />

        {stages.map((stage, i) => {
          // Topic numbers run 1, 2, 3 … down the whole roadmap.
          const offset = stages.slice(0, i).reduce((n, st) => n + st.topics.length, 0)
          return (
          <div key={stage.level} className="relative">
            <div className="relative z-10 flex py-8 pl-0 md:justify-center">
              <span className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow-sm dark:bg-white dark:text-slate-900">
                {levelLabel[stage.level] ?? stage.level}
                <span className="font-normal opacity-70">· {stage.title}</span>
                {stage.locked && <Lock className="h-3.5 w-3.5" aria-label="Locked" />}
              </span>
            </div>

            <ol className="grid gap-y-4 md:grid-cols-2 md:gap-x-16">
              {stage.topics.map((topic, j) => (
                <TopicNode
                  key={topic.id}
                  number={offset + j + 1}
                  href={`${base}/${topic.id}`}
                  topic={topic}
                  locked={stage.locked}
                  side={j % 2 === 0 ? 'left' : 'right'}
                  isNext={topic.id === nextTopicId}
                />
              ))}
            </ol>

            {/* One card under the first locked stage is enough. */}
            {stage.locked && !stages[i - 1]?.locked && (
              <div className="relative z-10 mt-8 flex pl-12 md:justify-center md:pl-0">
                <UnlockCard className="max-w-xl" />
              </div>
            )}
          </div>
          )
        })}

        <div className="relative z-10 flex pt-10 md:justify-center">
          <span className="inline-flex items-center gap-2 rounded-full border-2 border-amber-500 bg-white px-5 py-2 text-sm font-semibold text-amber-700 dark:bg-slate-950 dark:text-amber-400">
            <Check className="h-4 w-4" /> Finish
          </span>
        </div>
        <p className="relative z-10 mt-10 text-sm text-slate-500 md:text-center dark:text-slate-400">
          Last updated <time dateTime={roadmap.updatedAt}>{formatDate(roadmap.updatedAt)}</time>
        </p>
      </section>

    </div>
  )
}

function TopicNode({ number, href, topic, locked, side, isNext }: { number: number; href: string; topic: TopicNodeData; locked: boolean; side: 'left' | 'right'; isNext: boolean }) {
  return (
    <li id={topic.id} className="relative scroll-mt-28 pl-12 md:pl-0">
      {/* Connector from the box to the spine. Phones: spine is 1.1rem into the item, box starts at 3rem. */}
      <span
        aria-hidden
        className={cn(
          'absolute left-[1.1rem] top-1/2 h-0.5 w-[1.9rem] bg-slate-300 md:w-8 dark:bg-slate-700',
          side === 'left' ? 'md:left-auto md:-right-8' : 'md:-left-8',
          topic.done && 'bg-amber-400 dark:bg-amber-600',
        )}
      />
      <Link
        href={href}
        className={cn(
          'group flex w-full items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition',
          side === 'left' && 'md:flex-row-reverse md:text-right',
          locked
            ? 'border-dashed border-slate-300 bg-slate-50 text-slate-500 hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-400'
            : topic.done
              ? 'border-amber-500 bg-amber-50 text-amber-900 hover:bg-amber-100 dark:bg-amber-950/50 dark:text-amber-200'
              : 'border-slate-200 bg-white text-slate-900 shadow-sm hover:-translate-y-0.5 hover:border-amber-400 hover:shadow-md dark:border-slate-700 dark:bg-slate-900 dark:text-white',
          isNext && 'ring-2 ring-amber-400 ring-offset-2 dark:ring-offset-slate-950',
        )}
      >
        <span
          className={cn(
            'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2',
            locked ? 'border-slate-300 dark:border-slate-600' : topic.done ? 'border-amber-500 bg-amber-500 text-amber-950' : 'border-slate-300 dark:border-slate-600',
          )}
        >
          {locked ? <Lock className="h-3 w-3" /> : topic.done ? <Check className="h-3.5 w-3.5" /> : null}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-semibold"><span className="mr-1.5 tabular-nums text-amber-600 dark:text-amber-400">{number}.</span>{topic.title}</span>
          <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">
            {isNext ? <span className="font-medium text-amber-700 dark:text-amber-400">Up next · </span> : null}
            {locked ? `${topic.lessonCount} lessons` : `${topic.doneCount}/${topic.requiredCount} lessons`}
          </span>
        </span>
      </Link>
    </li>
  )
}
