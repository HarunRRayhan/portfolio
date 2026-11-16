import { Link, router, usePage } from '@inertiajs/react'
import { Trophy } from 'lucide-react'
import type { PageProps } from '@/types'
import { cn } from '@/lib/utils'

type Row = { rank: number; user_id: number; name: string; avatar_url: string | null; xp: number }
type Props = {
  period: 'day' | 'week' | 'month' | 'all'
  rows: Row[]
  me: { rank: number; xp: number } | null
  hidden: boolean
  points: Record<'signup' | 'newsletter' | 'lesson' | 'topic' | 'comment' | 'reply', number>
}

const tabs = [
  { id: 'day', label: 'Today' },
  { id: 'week', label: 'This week' },
  { id: 'month', label: 'This month' },
  { id: 'all', label: 'All time' },
] as const

const medal = ['bg-amber-400 text-amber-950', 'bg-slate-300 text-slate-900', 'bg-orange-300 text-orange-950']

export default function Leaderboard({ period, rows, me, hidden, points }: Props) {
  const { auth } = usePage<PageProps>().props
  const setHidden = (value: boolean) => router.patch('/leaderboard/visibility', { hidden: value }, { preserveScroll: true })

  const earn = [
    ['Create an account', points.signup, 'once'],
    ['Subscribe to the newsletter', points.newsletter, 'once'],
    ['Finish a roadmap lesson', points.lesson, 'per lesson'],
    ['Finish every lesson in a topic', points.topic, 'bonus'],
    ['Comment on a post, topic or lesson', points.comment, 'one per page'],
    ['Reply to a comment', points.reply, 'one per page'],
  ] as const

  return (
    <div className="pt-24">
      <section className="mx-auto max-w-3xl px-4 pb-24 pt-8 sm:px-6 lg:px-8">
        <h1 className="flex items-center gap-3 text-4xl font-semibold tracking-tight text-slate-950 dark:text-white">
          <Trophy className="h-9 w-9 text-amber-500" aria-hidden /> Leaderboard
        </h1>
        <p className="mt-3 text-slate-600 dark:text-slate-300">Earn XP by learning on the <Link href="/roadmaps" className="font-medium text-amber-700 underline underline-offset-2 dark:text-amber-400">roadmaps</Link> and joining the discussion.</p>

        <nav aria-label="Period" className="mt-8 inline-flex rounded-full border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-900">
          {tabs.map((t) => (
            <Link
              key={t.id}
              href={`/leaderboard?period=${t.id}`}
              preserveScroll
              aria-current={period === t.id ? 'page' : undefined}
              className={cn('rounded-full px-4 py-1.5 text-sm font-medium', period === t.id ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'text-slate-600 hover:text-slate-900 dark:text-slate-300')}
            >
              {t.label}
            </Link>
          ))}
        </nav>

        {auth?.user && (
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 dark:border-amber-900 dark:bg-amber-950/40">
            <p className="text-sm text-amber-950 dark:text-amber-100">
              {me ? <>You: <strong>#{me.rank}</strong> · <strong>{me.xp} XP</strong></> : 'No XP in this period yet.'}
              {hidden && <span className="ml-2 text-amber-800 dark:text-amber-300">(hidden from the board)</span>}
            </p>
            <label className="inline-flex items-center gap-2 text-sm text-amber-950 dark:text-amber-100">
              <input type="checkbox" checked={!hidden} onChange={(e) => setHidden(!e.target.checked)} className="rounded border-amber-300 text-amber-600" />
              Show me on the leaderboard
            </label>
          </div>
        )}

        {rows.length === 0 ? (
          <p className="mt-8 text-sm text-slate-500">Nobody has earned XP in this period yet. Be the first.</p>
        ) : (
          <ol className="mt-6 divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
            {rows.map((r) => (
              <li key={r.user_id} className={cn('flex items-center gap-4 px-5 py-3', auth?.user?.id === r.user_id && 'bg-amber-50/60 dark:bg-amber-950/30')}>
                <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold', medal[r.rank - 1] ?? 'text-slate-500')}>{r.rank}</span>
                {r.avatar_url ? (
                  <img src={r.avatar_url} alt="" className="h-9 w-9 rounded-full object-cover" loading="lazy" referrerPolicy="no-referrer" />
                ) : (
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-800 text-sm font-semibold text-white">{r.name.charAt(0).toUpperCase()}</span>
                )}
                <span className="min-w-0 flex-1 truncate font-medium text-slate-900 dark:text-white">{r.name}</span>
                <span className="font-semibold tabular-nums text-amber-700 dark:text-amber-400">{r.xp} XP</span>
              </li>
            ))}
          </ol>
        )}

        <h2 className="mt-12 text-lg font-semibold text-slate-900 dark:text-white">How to earn XP</h2>
        <ul className="mt-3 divide-y divide-slate-100 text-sm dark:divide-slate-800">
          {earn.map(([what, xp, limit]) => (
            <li key={what} className="flex items-center justify-between gap-4 py-2">
              <span className="text-slate-700 dark:text-slate-200">{what} <span className="text-slate-400">· {limit}</span></span>
              <span className="font-semibold tabular-nums text-amber-700 dark:text-amber-400">+{xp}</span>
            </li>
          ))}
        </ul>
        {!auth?.user && (
          <p className="mt-6 text-sm text-slate-600 dark:text-slate-300">
            <Link href="/login?redirect=%2Fleaderboard" className="font-semibold text-amber-700 underline underline-offset-2 dark:text-amber-400">Create a free account</Link> to start earning XP.
          </p>
        )}
      </section>
    </div>
  )
}
