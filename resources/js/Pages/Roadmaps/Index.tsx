import { Link, usePage } from '@inertiajs/react'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import type { PageProps } from '@/types'
import { ProgressBar, formatDate } from '@/Components/Roadmap/shared'
import { ArrowRight, Bookmark, Eye, Heart, Trophy } from 'lucide-react'
import { RoadmapArt, type RoadmapArtData } from '@/Components/Roadmap/RoadmapArt'

type RoadmapCard = {
  slug: string
  title: string
  summary: string
  category: string | null
  topicCount: number
  lessonCount: number
  levels: string[]
  loveCount: number
  viewCount: number
  buildsOn: { slug: string; title: string } | null
  updatedAt: string
  art: RoadmapArtData
}

type Mine = {
  slug: string
  title: string
  percent: number
  started: boolean
  saved: boolean
  continueTopicId: string | null
}

type Props = { roadmaps: RoadmapCard[]; mine: Mine[]; categories: Record<string, string> }

export default function RoadmapsIndex({ roadmaps, mine, categories }: Props) {
  const { auth } = usePage<PageProps>().props
  const [category, setCategory] = useState('all')
  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get('category') // after hydration, so SSR markup matches
    if (fromUrl && fromUrl in categories) setCategory(fromUrl)
  }, [categories])
  const pick = (c: string) => {
    setCategory(c)
    const url = new URL(window.location.href)
    if (c === 'all') url.searchParams.delete('category')
    else url.searchParams.set('category', c)
    history.replaceState(history.state, '', url)
  }
  const filters = [['all', 'All'], ...Object.entries(categories).filter(([id]) => roadmaps.some((r) => r.category === id))]
  const shown = category === 'all' ? roadmaps : roadmaps.filter((r) => r.category === category)
  return (
    <div className="pt-24">
      <section className="mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <h1 className="text-4xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-5xl">Learning roadmaps</h1>
          <p className="mt-4 text-lg leading-8 text-slate-600 dark:text-slate-300">
            Step-by-step paths from beginner to advanced. Each topic says what to learn, where to read about it, and gives you a prompt to take to your AI.
          </p>
          <Link href="/leaderboard" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-amber-700 hover:text-amber-600 dark:text-amber-400">
            <Trophy className="h-4 w-4" aria-hidden /> Earn XP and climb the leaderboard <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>

        {!auth?.user && (
          <p className="mt-8 max-w-3xl rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
            <Link href="/login?redirect=%2Froadmaps" className="font-semibold underline underline-offset-2">Sign in or create a free account</Link> to start roadmaps, save them for later and track your progress.
          </p>
        )}

        {mine.length > 0 && (
          <div className="mt-12">
            <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Your roadmaps</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {mine.map((m) => (
                <Link
                  key={m.slug}
                  href={`/roadmaps/${m.slug}${m.continueTopicId ? `/${m.continueTopicId}` : ''}`}
                  className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="flex items-center justify-between gap-4">
                    <p className="font-semibold text-slate-900 dark:text-white">{m.title}</p>
                    {m.saved && !m.started && (
                      <span className="inline-flex items-center gap-1 text-xs text-slate-500"><Bookmark className="h-3.5 w-3.5" /> Saved</span>
                    )}
                  </div>
                  <div className="mt-4 flex items-center gap-3">
                    <ProgressBar percent={m.percent} />
                    <span className="text-sm tabular-nums text-slate-600 dark:text-slate-300">{m.percent}%</span>
                  </div>
                  <p className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-amber-700 dark:text-amber-400">
                    {m.started ? 'Continue' : 'Start'} <ArrowRight className="h-4 w-4" />
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div role="group" aria-label="Filter roadmaps" className="mt-12 flex flex-wrap gap-2">
          {filters.map(([id, label]) => (
            <button
              key={id}
              type="button"
              aria-pressed={category === id}
              onClick={() => pick(id)}
              className={cn(
                'rounded-full border px-4 py-1.5 text-sm font-medium transition',
                category === id
                  ? 'border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-amber-400 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300',
              )}
            >
              {label}
              <span className="ml-1.5 tabular-nums opacity-60">{id === 'all' ? roadmaps.length : roadmaps.filter((r) => r.category === id).length}</span>
            </button>
          ))}
        </div>

        <div className="mt-8 grid gap-8 md:grid-cols-2 xl:grid-cols-3">
          {shown.map((r) => (
            <Link
              key={r.slug}
              href={`/roadmaps/${r.slug}`}
              className="group flex flex-col overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900"
            >
              <RoadmapArt art={r.art} />
              <div className="flex flex-1 flex-col p-6">
              <h2 className="text-2xl font-semibold text-slate-950 dark:text-white">{r.title}</h2>
              {r.buildsOn && <p className="mt-1 text-xs font-medium uppercase tracking-wider text-amber-700 dark:text-amber-400">Builds on {r.buildsOn.title}</p>}
              <p className="mt-2 flex-1 text-slate-600 dark:text-slate-300">{r.summary}</p>
              <div className="mt-6 flex flex-wrap items-center justify-between gap-2 text-sm text-slate-500 dark:text-slate-400">
                <span>{r.topicCount} topics · {r.lessonCount} lessons · Updated <time dateTime={r.updatedAt}>{formatDate(r.updatedAt)}</time></span>
                <span className="inline-flex items-center gap-3">
                  <span className="inline-flex items-center gap-1" title="Views"><Eye className="h-4 w-4" aria-hidden /> {r.viewCount.toLocaleString()}<span className="sr-only"> views</span></span>
                  <span className="inline-flex items-center gap-1" title="Loves"><Heart className="h-4 w-4" aria-hidden /> {r.loveCount}<span className="sr-only"> loves</span></span>
                </span>
              </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
