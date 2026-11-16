import { Link, usePage } from '@inertiajs/react'
import * as Dialog from '@radix-ui/react-dialog'
import { ArrowRight, Check, ChevronDown, Copy, ExternalLink, Heart, Lock, Search, Sparkles, X } from 'lucide-react'
import { useState, type ReactElement } from 'react'
import { Github } from '@/lib/icons'
import { cn } from '@/lib/utils'

export type Resource = { label: string; url: string; kind: string; own: boolean }

export type Lesson = {
  id: string
  title: string
  optional: boolean
  done: boolean
  summary?: string
  learn?: string[]
  resources?: Resource[]
  searchUrl?: string
  prompt?: string
  claudeUrl?: string
  chatgptUrl?: string
}

/** A, B, C … Z, then AA, AB … for lesson positions (0-based). */
export const lessonLetter = (i: number): string => (i < 26 ? '' : lessonLetter(Math.floor(i / 26) - 1)) + String.fromCharCode(65 + (i % 26))

export const levelLabel: Record<string, string> = { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced' }

export const external = { target: '_blank', rel: 'noopener noreferrer' } as const

// Dates are plain YYYY-MM-DD; format as UTC so no timezone shifts the day.
export const formatDate = (ymd: string) =>
  new Date(`${ymd}T00:00:00Z`).toLocaleDateString(undefined, { dateStyle: 'medium', timeZone: 'UTC' })

export function ProgressBar({ percent }: { percent: number }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} aria-label={`${percent}% done`}>
      <div className="h-full rounded-full bg-amber-500 transition-all" style={{ width: `${percent}%` }} />
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
      <SponsorDialog />
      <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">{ACCESS_RULE}</p>
    </div>
  )
}

const ACCESS_RULE = 'Give $5 in total for a month, $10 for a year, or $100 for life, in one payment or several. Unlocks every roadmap.'

/** "Sponsor me" opens a choice: GitHub Sponsors, or the sponsor page's other-payment section. Pass `children` for a custom trigger. */
export function SponsorDialog({ children }: { children?: ReactElement }) {
  const sponsorsUrl = (usePage().props as { sponsorsUrl?: string }).sponsorsUrl ?? '/sponsor-me'
  return (
    <Dialog.Root>
      {children ? (
        <Dialog.Trigger asChild>{children}</Dialog.Trigger>
      ) : (
        <Dialog.Trigger className="mt-3 inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200">
          <Heart className="h-4 w-4" /> Sponsor me
        </Dialog.Trigger>
      )}
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[70] bg-slate-950/60 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-[71] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
          <Dialog.Title className="text-lg font-semibold text-slate-900 dark:text-white">Sponsor me</Dialog.Title>
          <Dialog.Description className="mt-1 text-sm text-slate-600 dark:text-slate-300">{ACCESS_RULE}</Dialog.Description>
          <ul className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
            {[['$5', 'a month'], ['$10', 'a year'], ['$100', 'for life']].map(([amount, length]) => (
              <li key={amount} className="rounded-xl border border-slate-200 px-2 py-3 dark:border-slate-700">
                <span className="block text-base font-bold text-slate-900 dark:text-white">{amount}</span>
                <span className="text-xs text-slate-500 dark:text-slate-400">{length}</span>
              </li>
            ))}
          </ul>
          <a href={sponsorsUrl} target="_blank" rel="noopener noreferrer" className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#bf3989] px-4 py-3 text-sm font-semibold text-white hover:bg-[#a82e78]">
            <Github className="h-4 w-4" /> Sponsor on GitHub
          </a>
          <Link href="/sponsor-me#other-payment-methods" className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
            GitHub Sponsors doesn't work for me <ArrowRight className="h-4 w-4" />
          </Link>
          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">Sponsor with the GitHub account or email you sign in with here, so access unlocks automatically.</p>
          <Dialog.Close aria-label="Close" className="absolute right-4 top-4 rounded-full p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="h-4 w-4" />
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

export function ResourceList({ resources }: { resources: Resource[] }) {
  return (
    <ul className="mt-2 space-y-2">
      {resources.map((r) => (
        <li key={r.url}>
          <a href={r.url} {...external} className="inline-flex items-center gap-2 text-sm font-medium text-amber-700 hover:underline dark:text-amber-400">
            {r.label} <ExternalLink className="h-3.5 w-3.5" />
          </a>
          <span className={cn('ml-2 rounded px-1.5 py-0.5 text-[11px] uppercase tracking-wide', r.own ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' : 'bg-slate-100 text-slate-500 dark:bg-slate-800')}>
            {r.own ? "Harun's post" : r.kind}
          </span>
        </li>
      ))}
    </ul>
  )
}

export function LessonDetail({ lesson, loginHref }: { lesson: Lesson; loginHref: string }) {
  return (
    <div className="mt-5 space-y-5">
      {!!lesson.resources?.length && (
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Resources</h3>
          <ResourceList resources={lesson.resources} />
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
        <span className="inline-flex items-center gap-2"><Sparkles className="h-4 w-4 text-amber-600" /> Ask your AI</span>
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
            <Link href={loginHref} className="mt-3 inline-flex rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-amber-950 hover:bg-amber-400">
              Create a free account
            </Link>
          </div>
        )}
      </div>
    </details>
  )
}
