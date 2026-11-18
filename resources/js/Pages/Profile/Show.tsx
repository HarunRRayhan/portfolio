import { Link } from '@inertiajs/react'
import { BookOpen, ChevronDown, Mail, Shield, Trophy, UserRoundPen } from 'lucide-react'
import UserAvatar from '@/Components/UserAvatar'
import SponsorTag from '@/Components/SponsorTag'

type Props = {
  profile: {
    name: string
    avatarUrl: string | null
    bio: string | null
    anonymous: boolean
    sponsor: boolean
    joined: string | null
    xp: number
    rank: number | null
    lessonsDone: number
    roadmaps: { slug: string; title: string; percent: number }[]
  }
  isOwner: boolean
  admin: {
    id: number
    name: string
    email: string
    emailVerified: boolean
    provider: string | null
    role: string | null
    createdAt: string | null
    lastXpAt: string | null
    leaderboardHidden: boolean
    deletionScheduledAt: string | null
  } | null
}

export default function ProfileShow({ profile, isOwner, admin }: Props) {
  const stats = [
    ['XP', profile.xp.toLocaleString()],
    ['Rank', profile.rank ? `#${profile.rank}` : '—'],
    ['Lessons done', profile.lessonsDone.toLocaleString()],
  ] as const

  return (
    <div className="pt-24">
      <section className="mx-auto max-w-3xl px-4 pb-24 pt-8 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center gap-5">
          <UserAvatar name={profile.name} url={profile.avatarUrl} className="h-20 w-20 text-3xl" />
          <div className="min-w-0 flex-1">
            <h1 className="flex min-w-0 items-center gap-2 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">
              <span className="truncate">{profile.name}</span>
              {profile.sponsor && <SponsorTag />}
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {profile.anonymous ? 'Anonymous learner' : 'Learner'}
              {profile.joined && <> · joined {profile.joined}</>}
            </p>
          </div>
          {isOwner && (
            <Link href="/profile#public-profile" className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
              <UserRoundPen className="h-4 w-4" aria-hidden /> Edit profile
            </Link>
          )}
        </div>

        {profile.bio && <p className="mt-6 whitespace-pre-line text-slate-700 dark:text-slate-200">{profile.bio}</p>}

        <dl className="mt-8 grid grid-cols-3 gap-3">
          {stats.map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
              <dt className="text-xs text-slate-500 dark:text-slate-400">{label}</dt>
              <dd className="mt-1 text-xl font-semibold tabular-nums text-slate-900 dark:text-white">{value}</dd>
            </div>
          ))}
        </dl>

        <h2 className="mt-10 flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white"><BookOpen className="h-5 w-5 text-amber-500" aria-hidden /> Roadmaps</h2>
        {profile.roadmaps.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">No roadmaps started yet.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {profile.roadmaps.map((r) => (
              <li key={r.slug}>
                <Link href={`/roadmaps/${r.slug}`} className="block rounded-2xl border border-slate-200 bg-white px-4 py-3 hover:border-amber-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-amber-800">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="font-medium text-slate-900 dark:text-white">{r.title}</span>
                    <span className="tabular-nums text-slate-500">{r.percent}%</span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div className="h-full rounded-full bg-amber-500" style={{ width: `${r.percent}%` }} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}

        {admin && (
          <details className="group mt-10 rounded-2xl border border-rose-200 bg-rose-50 p-5 dark:border-rose-900 dark:bg-rose-950/30">
            <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-semibold text-rose-900 dark:text-rose-200 [&::-webkit-details-marker]:hidden">
              <Shield className="h-4 w-4" aria-hidden /> Admin only
              <ChevronDown className="ml-auto h-4 w-4 transition-transform group-open:rotate-180" aria-hidden />
            </summary>
            <dl className="mt-3 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
              {(
                [
                  ['User id', admin.id],
                  ['Real name', admin.name],
                  ['Email', `${admin.email}${admin.emailVerified ? '' : ' (unverified)'}`],
                  ['Sign-in', admin.provider ?? 'email link'],
                  ['Role', admin.role ?? 'user'],
                  ['Joined', admin.createdAt],
                  ['Last XP', admin.lastXpAt ?? '—'],
                  ['On leaderboard', admin.leaderboardHidden ? 'hidden' : 'shown'],
                  ['Deletion', admin.deletionScheduledAt ?? '—'],
                ] as const
              ).map(([k, v]) => (
                <div key={k} className="flex min-w-0 gap-2">
                  <dt className="shrink-0 text-rose-800/70 dark:text-rose-300/70">{k}</dt>
                  <dd className="min-w-0 break-all font-medium text-rose-950 dark:text-rose-100">{v}</dd>
                </div>
              ))}
            </dl>
            <a href={`mailto:${admin.email}`} className="mt-4 inline-flex items-center gap-2 rounded-full bg-rose-900 px-4 py-1.5 text-sm font-semibold text-white hover:bg-rose-800 dark:bg-rose-200 dark:text-rose-950">
              <Mail className="h-4 w-4" aria-hidden /> Email
            </a>
          </details>
        )}

        <Link href="/leaderboard" className="mt-10 inline-flex items-center gap-2 text-sm font-semibold text-amber-700 hover:text-amber-600 dark:text-amber-400">
          <Trophy className="h-4 w-4" aria-hidden /> Leaderboard
        </Link>
      </section>
    </div>
  )
}
