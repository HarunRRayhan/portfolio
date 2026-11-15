import { Link } from '@inertiajs/react'
import { Check, ChevronDown, Copy, ExternalLink, Lock, Search, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { Github } from '@/lib/icons'
import { cn } from '@/lib/utils'

export type Resource = { label: string; url: string; kind: string; own: boolean }

export type Lesson = {
  id: string
  title: string
  summary: string
  optional: boolean
  done: boolean
  learn?: string[]
  resources?: Resource[]
  searchUrl?: string
  prompt?: string
  claudeUrl?: string
  chatgptUrl?: string
}

export const levelLabel: Record<string, string> = { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced' }

export const external = { target: '_blank', rel: 'noopener noreferrer' } as const

// Dates are plain YYYY-MM-DD; format as UTC so no timezone shifts the day.
export const formatDate = (ymd: string) =>
  new Date(`${ymd}T00:00:00Z`).toLocaleDateString(undefined, { dateStyle: 'medium', timeZone: 'UTC' })

export function ProgressBar({ percent }: { percent: number }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} aria-label={`${percent}% done`}>
      <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${percent}%` }} />
    </div>
  )
}

export function OptionalTag() {
  return (
    <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[11px] font-medium text-sky-700 ring-1 ring-sky-200 dark:bg-sky-950 dark:text-sky-300 dark:ring-sky-900">
      Optional · go deeper
    </span>
  )
}

export function UnlockCard({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900', className)}>
      <p className="text-sm text-slate-700 dark:text-slate-200">Intermediate and Advanced topics are for sponsors.</p>
      <Link
        href="/sponsor-me"
        className="mt-3 inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
      >
        <Github className="h-4 w-4" /> Sponsor on GitHub
      </Link>
      <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">Any amount of $5 or more gets you access to every roadmap's Intermediate and Advanced topics.</p>
    </div>
  )
}

export function LessonDetail({ lesson, loginHref }: { lesson: Lesson; loginHref: string }) {
  return (
    <div className="mt-5 space-y-5">
      {!!lesson.resources?.length && (
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Resources</h3>
          <ul className="mt-2 space-y-2">
            {lesson.resources.map((r) => (
              <li key={r.url}>
                <a href={r.url} {...external} className="inline-flex items-center gap-2 text-sm font-medium text-emerald-700 hover:underline dark:text-emerald-400">
                  {r.label} <ExternalLink className="h-3.5 w-3.5" />
                </a>
                <span className={cn('ml-2 rounded px-1.5 py-0.5 text-[11px] uppercase tracking-wide', r.own ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' : 'bg-slate-100 text-slate-500 dark:bg-slate-800')}>
                  {r.own ? "Harun's post" : r.kind}
                </span>
              </li>
            ))}
          </ul>
          {lesson.searchUrl && (
            <a href={lesson.searchUrl} {...external} className="mt-3 inline-flex items-center gap-2 text-sm text-slate-600 hover:underline dark:text-slate-300">
              <Search className="h-4 w-4" /> Search the web for this lesson
            </a>
          )}
        </section>
      )}

      <AskYourAi lesson={lesson} loginHref={loginHref} />
    </div>
  )
}

/** Folded by default. Guests see a sign-up button instead of the prompt (the server doesn't send it to them). */
function AskYourAi({ lesson, loginHref }: { lesson: Lesson; loginHref: string }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(lesson.prompt ?? '')
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }
  const button = 'rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800'

  return (
    <details className="group rounded-xl border border-slate-200 dark:border-slate-800">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 text-sm font-semibold text-slate-800 dark:text-slate-100 [&::-webkit-details-marker]:hidden">
        <span className="inline-flex items-center gap-2"><Sparkles className="h-4 w-4 text-emerald-600" /> Ask your AI</span>
        <ChevronDown className="h-4 w-4 text-slate-400 transition group-open:rotate-180" />
      </summary>
      <div className="border-t border-slate-200 px-4 py-4 dark:border-slate-800">
        {lesson.prompt ? (
          <>
            <p className="rounded-lg bg-slate-50 p-3 font-mono text-xs leading-5 text-slate-700 dark:bg-slate-950 dark:text-slate-300">{lesson.prompt}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button onClick={copy} className={cn(button, 'inline-flex items-center gap-1.5')}>
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />} {copied ? 'Copied' : 'Copy prompt'}
              </button>
              {lesson.claudeUrl && <a href={lesson.claudeUrl} {...external} className={button}>Open in Claude</a>}
              {lesson.chatgptUrl && <a href={lesson.chatgptUrl} {...external} className={button}>Open in ChatGPT</a>}
            </div>
          </>
        ) : (
          <div className="text-sm text-slate-600 dark:text-slate-300">
            <p className="inline-flex items-center gap-2"><Lock className="h-4 w-4" /> You need a free account to use the AI prompt.</p>
            <Link href={loginHref} className="mt-3 inline-flex rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500">
              Create a free account
            </Link>
          </div>
        )}
      </div>
    </details>
  )
}
