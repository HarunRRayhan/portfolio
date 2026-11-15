import { Link, router, usePage } from '@inertiajs/react'
import { Bookmark, Check, ChevronDown, Copy, ExternalLink, Heart, Lock, Search, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import type { PageProps } from '@/types'
import { ProgressBar } from './Index'

type Resource = { label: string; url: string; kind: string; own: boolean }

type Step = {
  id: string
  title: string
  summary: string
  done: boolean
  learn?: string[]
  resources?: Resource[]
  searchUrl?: string
  prompt?: string
  claudeUrl?: string
  chatgptUrl?: string
}

type Stage = { level: string; title: string; locked: boolean; steps: Step[] }

type Props = {
  roadmap: { slug: string; title: string; summary: string }
  stages: Stage[]
  hasPaidAccess: boolean
  started: boolean
  loved: boolean
  saved: boolean
  loveCount: number
  percent: number
}

const levelLabel: Record<string, string> = { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced' }

const external = { target: '_blank', rel: 'noopener noreferrer' } as const

export default function RoadmapShow({ roadmap, stages, started, loved, saved, loveCount, percent }: Props) {
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

  return (
    <div className="pt-24">
      <section className="mx-auto max-w-4xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
        <Link href="/roadmaps" className="text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-200">← All roadmaps</Link>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-5xl">{roadmap.title}</h1>
        <p className="mt-4 text-lg leading-8 text-slate-600 dark:text-slate-300">{roadmap.summary}</p>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          {!started && (
            <button onClick={() => act('post', '/start')} className="rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500">
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
        </div>

        {auth?.user && (
          <div className="mt-6 flex items-center gap-3">
            <ProgressBar percent={percent} />
            <span className="text-sm tabular-nums text-slate-600 dark:text-slate-300">{percent}%</span>
          </div>
        )}

        <ol className="mt-12 space-y-12">
          {stages.map((stage) => (
            <li key={stage.level}>
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white dark:bg-white dark:text-slate-900">
                  {levelLabel[stage.level] ?? stage.level}
                </span>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">{stage.title}</h2>
                {stage.locked && <Lock className="h-4 w-4 text-slate-400" aria-label="Locked" />}
              </div>

              <ol className="mt-6 border-l-2 border-slate-200 dark:border-slate-800">
                {stage.steps.map((step) => (
                  <StepNode key={step.id} step={step} locked={stage.locked} onToggle={() => act(step.done ? 'delete' : 'post', `/steps/${step.id}`)} />
                ))}
              </ol>

              {stage.locked && <UnlockCard />}
            </li>
          ))}
        </ol>
      </section>
    </div>
  )
}

function StepNode({ step, locked, onToggle }: { step: Step; locked: boolean; onToggle: () => void }) {
  const [open, setOpen] = useState(false)

  return (
    <li id={step.id} className="relative scroll-mt-28 pb-6 pl-8">
      {locked ? (
        <span className="absolute -left-[11px] top-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-950">
          <Lock className="h-2.5 w-2.5 text-slate-400" />
        </span>
      ) : (
        <button
          onClick={onToggle}
          aria-pressed={step.done}
          aria-label={step.done ? `Mark "${step.title}" not done` : `Mark "${step.title}" done`}
          className={cn('absolute -left-[11px] top-1 flex h-5 w-5 items-center justify-center rounded-full border-2', step.done ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300 bg-white hover:border-emerald-500 dark:border-slate-600 dark:bg-slate-950')}
        >
          {step.done && <Check className="h-3 w-3" />}
        </button>
      )}

      {locked ? (
        <div>
          <p className="font-semibold text-slate-500 dark:text-slate-400">{step.title}</p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-500">{step.summary}</p>
        </div>
      ) : (
        <>
          <button onClick={() => setOpen(!open)} aria-expanded={open} className="flex w-full items-start justify-between gap-4 text-left">
            <span>
              <span className={cn('block font-semibold', step.done ? 'text-slate-500 line-through decoration-emerald-500/60' : 'text-slate-900 dark:text-white')}>{step.title}</span>
              <span className="mt-1 block text-sm text-slate-600 dark:text-slate-300">{step.summary}</span>
            </span>
            <ChevronDown className={cn('mt-1 h-5 w-5 shrink-0 text-slate-400 transition', open && 'rotate-180')} />
          </button>
          {open && <StepDetail step={step} />}
        </>
      )}
    </li>
  )
}

function StepDetail({ step }: { step: Step }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(step.prompt ?? '')
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="mt-4 space-y-5 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      {!!step.learn?.length && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">What to learn</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700 dark:text-slate-200">
            {step.learn.map((l) => <li key={l}>{l}</li>)}
          </ul>
        </div>
      )}

      {!!step.resources?.length && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Resources</h3>
          <ul className="mt-2 space-y-2">
            {step.resources.map((r) => (
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
          {step.searchUrl && (
            <a href={step.searchUrl} {...external} className="mt-3 inline-flex items-center gap-2 text-sm text-slate-600 hover:underline dark:text-slate-300">
              <Search className="h-4 w-4" /> Search the web for this topic
            </a>
          )}
        </div>
      )}

      {step.prompt && (
        <div>
          <h3 className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500"><Sparkles className="h-3.5 w-3.5" /> Ask your AI</h3>
          <p className="mt-2 rounded-xl bg-slate-50 p-3 font-mono text-xs leading-5 text-slate-700 dark:bg-slate-950 dark:text-slate-300">{step.prompt}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button onClick={copy} className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />} {copied ? 'Copied' : 'Copy prompt'}
            </button>
            {step.claudeUrl && <a href={step.claudeUrl} {...external} className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">Open in Claude</a>}
            {step.chatgptUrl && <a href={step.chatgptUrl} {...external} className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">Open in ChatGPT</a>}
          </div>
        </div>
      )}
    </div>
  )
}

function UnlockCard() {
  return (
    <div className="ml-8 rounded-2xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-900 dark:bg-amber-950/40">
      <p className="font-semibold text-amber-950 dark:text-amber-200">Sponsor me</p>
      <p className="mt-1 text-sm text-amber-900/80 dark:text-amber-200/80">Any amount of $5 or more unlocks Intermediate and Advanced.</p>
      <Link href="/sponsor-me" className="mt-4 inline-flex rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-amber-950 hover:bg-amber-400">
        Sponsor me
      </Link>
    </div>
  )
}
