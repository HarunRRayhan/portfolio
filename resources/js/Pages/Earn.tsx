import { Link, usePage } from '@inertiajs/react'
import { Trophy } from 'lucide-react'
import type { PageProps } from '@/types'

type Props = { points: Record<'signup' | 'newsletter' | 'lesson' | 'topic' | 'comment' | 'reply', number> }

export default function Earn({ points }: Props) {
  const { auth } = usePage<PageProps>().props

  const groups = [
    {
      title: 'Learn',
      items: [
        ['Finish a roadmap lesson', points.lesson, 'per lesson'],
        ['Finish every lesson in a topic', points.topic, 'bonus'],
      ],
    },
    {
      title: 'Join in',
      items: [
        ['Comment on a post, topic or lesson', points.comment, 'one per page'],
        ['Reply to a comment', points.reply, 'one per page'],
      ],
    },
    {
      title: 'Get started',
      items: [
        ['Create an account', points.signup, 'once'],
        ['Subscribe to the newsletter', points.newsletter, 'once'],
      ],
    },
  ] as const

  return (
    <div className="pt-24">
      <section className="mx-auto max-w-3xl px-4 pb-24 pt-8 sm:px-6 lg:px-8">
        <h1 className="flex items-center gap-3 text-4xl font-semibold tracking-tight text-slate-950 dark:text-white">
          <Trophy className="h-9 w-9 text-amber-500" aria-hidden /> How to earn XP
        </h1>
        <p className="mt-3 text-slate-600 dark:text-slate-300">
          XP counts on the <Link href="/leaderboard" className="font-medium text-amber-700 underline underline-offset-2 dark:text-amber-400">leaderboard</Link> by day, week, month, year and all time. Each reward is given once, so there is no way to farm it.
        </p>

        {groups.map((g) => (
          <div key={g.title}>
            <h2 className="mt-10 text-lg font-semibold text-slate-900 dark:text-white">{g.title}</h2>
            <ul className="mt-3 divide-y divide-slate-100 text-sm dark:divide-slate-800">
              {g.items.map(([what, xp, limit]) => (
                <li key={what} className="flex items-center justify-between gap-4 py-2">
                  <span className="text-slate-700 dark:text-slate-200">{what} <span className="text-slate-400">· {limit}</span></span>
                  <span className="font-semibold tabular-nums text-amber-700 dark:text-amber-400">+{xp}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <p className="mt-10 text-sm text-slate-600 dark:text-slate-300">
          {auth?.user ? (
            <Link href="/roadmaps" className="font-semibold text-amber-700 underline underline-offset-2 dark:text-amber-400">Start a roadmap</Link>
          ) : (
            <Link href="/login?redirect=%2Fearn" className="font-semibold text-amber-700 underline underline-offset-2 dark:text-amber-400">Create a free account</Link>
          )}{' '}
          to start earning.
        </p>
      </section>
    </div>
  )
}
