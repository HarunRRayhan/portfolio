import { Link, usePage } from '@inertiajs/react'
import * as Dialog from '@radix-ui/react-dialog'
import { ArrowRight, Check, Copy, ExternalLink, Heart, Lock, Search, Sparkles, X } from 'lucide-react'
import { useEffect, useState, type ReactElement } from 'react'
import { Github } from '@/lib/icons'
import { cn } from '@/lib/utils'
import { getImageUrl } from '@/lib/imageUtils'

export type Resource = { label: string; url: string; kind: string; own: boolean }

export type Lesson = {
  id: string
  title: string
  optional: boolean
  done: boolean
  summary?: string
  learn?: string[]
  bodyHtml?: string | null
  resources?: Resource[]
  searchUrl?: string
  prompt?: string
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

/** Shown on roadmaps that set `free: true`: every level opens without sponsoring. */
export function FreeTag({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:ring-emerald-900', className)}>
      Free, every lesson
    </span>
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
          <Link href="/sponsor-me/pay" className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
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

type LessonTab = 'overview' | 'resources' | 'ask-ai'

/** Overview, Resources and Ask AI for one lesson. `#resources` / `#ask-ai` open a tab directly. */
export function LessonDetail({ lesson, loginHref }: { lesson: Lesson; loginHref: string }) {
  const [tab, setTab] = useState<LessonTab>('overview')
  useEffect(() => {
    const fromHash = window.location.hash.slice(1) // after hydration, so SSR markup matches
    if (fromHash === 'resources' || fromHash === 'ask-ai') setTab(fromHash)
  }, [lesson.id])
  const pick = (t: LessonTab) => {
    setTab(t)
    history.replaceState(history.state, '', t === 'overview' ? window.location.pathname + window.location.search : `#${t}`)
  }
  const tabs: [LessonTab, string][] = [['overview', 'Overview'], ['resources', `Resources${lesson.resources?.length ? ` (${lesson.resources.length})` : ''}`], ['ask-ai', 'Ask AI']]

  return (
    <div className="mt-8">
      <div role="tablist" aria-label="Lesson sections" className="inline-flex rounded-full border border-slate-200 p-1 dark:border-slate-800">
        {tabs.map(([id, label]) => (
          <button
            key={id}
            role="tab"
            id={`tab-${id}`}
            aria-selected={tab === id}
            aria-controls={`panel-${id}`}
            onClick={() => pick(id)}
            className={cn('inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium', tab === id ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'text-slate-600 hover:text-slate-900 dark:text-slate-300')}
          >
            {id === 'ask-ai' && <Sparkles className="h-3.5 w-3.5" />}
            {label}
          </button>
        ))}
      </div>

      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} className="mt-6">
        {tab === 'overview' && (
          <div className="space-y-6">
            {lesson.summary && <p className="text-base leading-7 text-slate-700 dark:text-slate-200">{lesson.summary}</p>}
            {lesson.bodyHtml && (
              // Rendered server-side from the roadmap YAML with raw HTML stripped.
              <div
                className="space-y-4 text-[15px] leading-7 text-slate-700 dark:text-slate-300 [&_a]:font-medium [&_a]:text-amber-700 [&_a]:underline dark:[&_a]:text-amber-400 [&_code]:rounded [&_code]:bg-slate-100 [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[13px] dark:[&_code]:bg-slate-800 [&_h3]:mt-6 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-slate-900 dark:[&_h3]:text-white [&_li]:pl-1 [&_ol]:list-decimal [&_ol]:space-y-1 [&_ol]:pl-5 [&_pre]:overflow-x-auto [&_pre]:rounded-xl [&_pre]:bg-slate-950 [&_pre]:p-4 [&_pre]:text-slate-100 [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_strong]:font-semibold [&_strong]:text-slate-900 dark:[&_strong]:text-white [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5 [&_img]:w-full [&_img]:rounded-xl [&_img]:border [&_img]:border-slate-200 dark:[&_img]:border-slate-700 dark:[&_img]:invert dark:[&_img]:hue-rotate-180 [&_table]:block [&_table]:max-w-full [&_table]:overflow-x-auto [&_table]:text-sm [&_td]:border [&_td]:border-slate-200 [&_td]:px-3 [&_td]:py-1.5 dark:[&_td]:border-slate-700 [&_th]:border [&_th]:border-slate-200 [&_th]:bg-slate-50 [&_th]:px-3 [&_th]:py-1.5 [&_th]:text-left [&_th]:font-semibold dark:[&_th]:border-slate-700 dark:[&_th]:bg-slate-800"
                dangerouslySetInnerHTML={{ __html: lesson.bodyHtml }}
              />
            )}
            {!!lesson.learn?.length && (
              <section>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">What you'll learn</h3>
                <ul className="mt-3 space-y-2">
                  {lesson.learn.map((item, i) => (
                    <li key={i} className="flex gap-2 text-sm text-slate-700 dark:text-slate-300">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden />{item}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        )}

        {tab === 'resources' && (
          <section>
            {lesson.resources?.length ? <ResourceList resources={lesson.resources} /> : <p className="text-sm text-slate-500">No links for this lesson yet.</p>}
            {lesson.searchUrl && (
              <a href={lesson.searchUrl} {...external} className="mt-4 inline-flex items-center gap-2 text-sm text-slate-600 hover:underline dark:text-slate-300">
                <Search className="h-4 w-4" /> Search the web for this lesson
              </a>
            )}
          </section>
        )}

        {tab === 'ask-ai' && <AskYourAi lesson={lesson} loginHref={loginHref} />}
      </div>
    </div>
  )
}

/**
 * Assistants that accept a prefilled prompt in the URL open with it; the rest (no such link) get it copied
 * to the clipboard first, then open so the reader can paste. "Copy prompt" covers any other model.
 */
const ASSISTANTS: { name: string; logo: string; url: (q: string) => string; prefill: boolean }[] = [
  { name: 'ChatGPT', logo: '/images/ai/chatgpt.png', url: (q) => `https://chatgpt.com/?q=${q}`, prefill: true },
  { name: 'Claude', logo: '/images/ai/claude.png', url: (q) => `https://claude.ai/new?q=${q}`, prefill: true },
  { name: 'Gemini', logo: '/images/ai/gemini.png', url: () => 'https://gemini.google.com/app', prefill: false },
  { name: 'Perplexity', logo: '/images/ai/perplexity.png', url: (q) => `https://www.perplexity.ai/search?q=${q}`, prefill: true },
  { name: 'Grok', logo: '/images/ai/grok.png', url: (q) => `https://grok.com/?q=${q}`, prefill: true },
  { name: 'Copilot', logo: '/images/ai/copilot.png', url: (q) => `https://copilot.microsoft.com/?q=${q}`, prefill: true },
  { name: 'Mistral', logo: '/images/ai/mistral.png', url: (q) => `https://chat.mistral.ai/chat?q=${q}`, prefill: true },
  { name: 'DeepSeek', logo: '/images/ai/deepseek.png', url: () => 'https://chat.deepseek.com/', prefill: false },
]

/** Guests see a sign-up button instead of the prompt (the server doesn't send it to them). */
function AskYourAi({ lesson, loginHref }: { lesson: Lesson; loginHref: string }) {
  const [copied, setCopied] = useState<string | null>(null)
  const copy = async (label: string) => {
    try {
      await navigator.clipboard.writeText(lesson.prompt ?? '')
      setCopied(label)
      setTimeout(() => setCopied(null), 2500)
      return true
    } catch {
      return false
    }
  }
  const open = async (a: (typeof ASSISTANTS)[number]) => {
    if (!a.prefill) await copy(a.name)
    window.open(a.url(encodeURIComponent(lesson.prompt ?? '')), '_blank', 'noopener,noreferrer')
  }
  const button = 'inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-amber-400 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800'

  if (!lesson.prompt) {
    return (
      <div className="rounded-xl border border-slate-200 p-4 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-300">
        <p className="inline-flex items-center gap-2"><Lock className="h-4 w-4" /> You need a free account to use the AI prompt.</p>
        <Link href={loginHref} className="mt-3 flex w-fit rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-amber-950 hover:bg-amber-400">
          Create a free account
        </Link>
      </div>
    )
  }

  return (
    <div>
      <p className="text-sm text-slate-600 dark:text-slate-300">Open this lesson in your AI. The prompt is filled in and links back to this roadmap.</p>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {ASSISTANTS.map((a) => (
          <button key={a.name} onClick={() => open(a)} className="flex items-center gap-2.5 rounded-xl border border-slate-200 px-3 py-2.5 text-left text-sm font-medium text-slate-800 transition hover:border-amber-400 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800" title={a.prefill ? `Open in ${a.name}` : 'Copies the prompt, then opens the site so you can paste it'}>
            <img src={getImageUrl(a.logo)} alt="" width={20} height={20} className="h-5 w-5 shrink-0 rounded" loading="lazy" />
            <span className="min-w-0 flex-1 truncate">{a.name}</span>
            {copied === a.name ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <ExternalLink className="h-3.5 w-3.5 text-slate-400" />}
          </button>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button onClick={() => copy('prompt')} className={cn(button, 'border-slate-900 bg-slate-900 text-white hover:bg-slate-700 dark:border-white dark:bg-white dark:text-slate-900')}>
          {copied === 'prompt' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />} {copied === 'prompt' ? 'Copied' : 'Copy prompt for another AI'}
        </button>
      </div>
      {copied && copied !== 'prompt' && <p role="status" className="mt-2 text-xs text-slate-500">Prompt copied. Paste it into {copied}.</p>}
      <details className="mt-4 rounded-xl border border-slate-200 dark:border-slate-800">
        <summary className="cursor-pointer px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200">Show the prompt</summary>
        <p className="border-t border-slate-200 p-4 font-mono text-xs leading-5 text-slate-700 dark:border-slate-800 dark:text-slate-300">{lesson.prompt}</p>
      </details>
    </div>
  )
}
