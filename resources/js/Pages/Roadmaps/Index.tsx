import { Link } from '@inertiajs/react'
import { ArrowRight, Bookmark, Heart, Route } from 'lucide-react'

type RoadmapCard = {
  slug: string
  title: string
  summary: string
  stepCount: number
  levels: string[]
  loveCount: number
  buildsOn: { slug: string; title: string } | null
}

type Mine = {
  slug: string
  title: string
  percent: number
  started: boolean
  saved: boolean
  continueStepId: string | null
}

type Props = { roadmaps: RoadmapCard[]; mine: Mine[] }

export function ProgressBar({ percent }: { percent: number }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} aria-label={`${percent}% done`}>
      <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${percent}%` }} />
    </div>
  )
}

export default function RoadmapsIndex({ roadmaps, mine }: Props) {
  return (
    <div className="pt-24">
      <section className="mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <h1 className="text-4xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-5xl">Learning roadmaps</h1>
          <p className="mt-4 text-lg leading-8 text-slate-600 dark:text-slate-300">
            Step-by-step paths from beginner to advanced. Each topic says what to learn, where to read about it, and gives you a prompt to take to your AI.
          </p>
        </div>

        {mine.length > 0 && (
          <div className="mt-12">
            <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Your roadmaps</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {mine.map((m) => (
                <Link
                  key={m.slug}
                  href={`/roadmaps/${m.slug}${m.continueStepId ? `#${m.continueStepId}` : ''}`}
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
                  <p className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-emerald-700 dark:text-emerald-400">
                    {m.started ? 'Continue' : 'Start'} <ArrowRight className="h-4 w-4" />
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="mt-12 grid gap-8 md:grid-cols-2 xl:grid-cols-3">
          {roadmaps.map((r) => (
            <Link
              key={r.slug}
              href={`/roadmaps/${r.slug}`}
              className="group flex flex-col rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900"
            >
              <Route className="h-8 w-8 text-emerald-600" />
              <h2 className="mt-4 text-2xl font-semibold text-slate-950 dark:text-white">{r.title}</h2>
              {r.buildsOn && <p className="mt-1 text-xs font-medium uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Builds on {r.buildsOn.title}</p>}
              <p className="mt-2 flex-1 text-slate-600 dark:text-slate-300">{r.summary}</p>
              <div className="mt-6 flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
                <span>{r.stepCount} topics · {r.levels.length} levels</span>
                <span className="inline-flex items-center gap-1"><Heart className="h-4 w-4" /> {r.loveCount}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
