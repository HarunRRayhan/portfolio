import { Link, router, usePage } from '@inertiajs/react'
import { Bookmark, Check, Copy, ExternalLink, Eye, Heart, Lock, Search, Share2, Sparkles } from 'lucide-react'
import { ShareButton } from '@/Components/ShareButton'
import { useEffect, useState } from 'react'
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/Components/ui/sheet'
import { Github } from '@/lib/icons'
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
  roadmap: { slug: string; title: string; summary: string; buildsOn: { slug: string; title: string } | null }
  stages: Stage[]
  hasPaidAccess: boolean
  started: boolean
  loved: boolean
  saved: boolean
  loveCount: number
  percent: number
  viewCount: number
  canonicalUrl: string
}

const levelLabel: Record<string, string> = { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced' }

const external = { target: '_blank', rel: 'noopener noreferrer' } as const

export default function RoadmapShow({ roadmap, stages, started, loved, saved, loveCount, percent, viewCount, canonicalUrl }: Props) {
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

  const [openId, setOpenId] = useState<string | null>(null)
  const all = stages.flatMap((stage) => stage.steps.map((step) => ({ stage, step })))
  const open = all.find((x) => x.step.id === openId) ?? null
  const nextId = auth?.user ? all.find((x) => !x.stage.locked && !x.step.done)?.step.id : undefined

  const [views, setViews] = useState(viewCount)
  useEffect(() => {
    fetch(`${base}/view`, { method: 'POST', headers: { 'X-Requested-With': 'XMLHttpRequest' } })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && typeof d.views === 'number' && setViews(d.views))
      .catch(() => {})
  }, [base])

  // "Continue" links land on #step-id: open that topic.
  useEffect(() => {
    const id = window.location.hash.slice(1)
    if (id && all.some((x) => x.step.id === id)) {
      document.getElementById(id)?.scrollIntoView({ block: 'center' })
      setOpenId(id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="pt-24">
      <section className="mx-auto max-w-4xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
        <Link href="/roadmaps" className="text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-200">← All roadmaps</Link>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-5xl">{roadmap.title}</h1>
        <p className="mt-4 text-lg leading-8 text-slate-600 dark:text-slate-300">{roadmap.summary}</p>
        {roadmap.buildsOn && (
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
            Builds on{' '}
            <Link href={`/roadmaps/${roadmap.buildsOn.slug}`} className="font-medium text-emerald-700 underline-offset-2 hover:underline dark:text-emerald-400">
              {roadmap.buildsOn.title}
            </Link>
            . Do its Beginner stage first if these topics are new to you.
          </p>
        )}

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
          <p className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
            <Link href={loginHref} className="font-semibold underline underline-offset-2">Sign in or create a free account</Link> to tick off topics and track your progress.
          </p>
        )}

        {auth?.user && (
          <div className="mt-6 flex items-center gap-3">
            <ProgressBar percent={percent} />
            <span className="text-sm tabular-nums text-slate-600 dark:text-slate-300">{percent}%</span>
          </div>
        )}

        <p className="mt-10 text-sm text-slate-500 dark:text-slate-400">Click a topic to see what to learn, resources and an AI prompt.</p>
      </section>

      <section className="relative mx-auto max-w-5xl px-4 pb-24 sm:px-6 lg:px-8">
        {/* The spine: left edge on phones, centre from md up. */}
        <div aria-hidden className="absolute bottom-24 left-[2.1rem] top-0 w-0.5 bg-slate-300 sm:left-[2.6rem] md:left-1/2 md:-translate-x-1/2 dark:bg-slate-700" />

        {stages.map((stage, i) => (
          <div key={stage.level} className="relative">
            <div className="relative z-10 flex py-8 pl-0 md:justify-center">
              <span className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow-sm dark:bg-white dark:text-slate-900">
                {levelLabel[stage.level] ?? stage.level}
                <span className="font-normal opacity-70">· {stage.title}</span>
                {stage.locked && <Lock className="h-3.5 w-3.5" aria-label="Locked" />}
              </span>
            </div>

            <ol className="grid gap-y-4 md:grid-cols-2 md:gap-x-16">
              {stage.steps.map((step, j) => (
                <TopicNode
                  key={step.id}
                  step={step}
                  locked={stage.locked}
                  side={j % 2 === 0 ? 'left' : 'right'}
                  isNext={step.id === nextId}
                  onOpen={() => setOpenId(step.id)}
                />
              ))}
            </ol>

            {/* One card under the first locked stage is enough. */}
            {stage.locked && !stages[i - 1]?.locked && (
              <div className="relative z-10 mt-8 flex pl-12 md:justify-center md:pl-0">
                <UnlockCard />
              </div>
            )}
          </div>
        ))}

        <div className="relative z-10 flex pt-10 md:justify-center">
          <span className="inline-flex items-center gap-2 rounded-full border-2 border-emerald-500 bg-white px-5 py-2 text-sm font-semibold text-emerald-700 dark:bg-slate-950 dark:text-emerald-400">
            <Check className="h-4 w-4" /> Finish
          </span>
        </div>
      </section>

      <Sheet open={!!open} onOpenChange={(o) => !o && setOpenId(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          {open && (
            <>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{levelLabel[open.stage.level]}</p>
              <SheetTitle className="mt-1 pr-8 text-2xl">{open.step.title}</SheetTitle>
              <SheetDescription className="mt-2 text-base">{open.step.summary}</SheetDescription>
              {open.stage.locked ? (
                <div className="mt-6"><UnlockCard /></div>
              ) : (
                <>
                  <button
                    onClick={() => act(open.step.done ? 'delete' : 'post', `/steps/${open.step.id}`)}
                    className={cn('mt-5 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold', open.step.done ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-emerald-600 text-white hover:bg-emerald-500')}
                  >
                    <Check className="h-4 w-4" /> {open.step.done ? 'Done (click to undo)' : auth?.user ? 'Mark as done' : 'Sign in to track progress'}
                  </button>
                  <StepDetail step={open.step} />
                </>
              )}
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}

function TopicNode({ step, locked, side, isNext, onOpen }: { step: Step; locked: boolean; side: 'left' | 'right'; isNext: boolean; onOpen: () => void }) {
  return (
    <li id={step.id} className="relative scroll-mt-28 pl-12 md:pl-0">
      {/* Connector from the box to the spine. */}
      <span
        aria-hidden
        className={cn(
          // Phones: from the spine (1.1rem into the item) to the box (3rem). md+: box edge to the centre.
          'absolute left-[1.1rem] top-1/2 h-0.5 w-[1.9rem] bg-slate-300 md:w-8 dark:bg-slate-700',
          side === 'left' ? 'md:left-auto md:-right-8' : 'md:-left-8',
          step.done && 'bg-emerald-400 dark:bg-emerald-600',
        )}
      />
      <button
        onClick={onOpen}
        className={cn(
          'group flex w-full items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition',
          side === 'left' && 'md:flex-row-reverse md:text-right',
          locked
            ? 'border-dashed border-slate-300 bg-slate-50 text-slate-500 hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-400'
            : step.done
              ? 'border-emerald-500 bg-emerald-50 text-emerald-900 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-200'
              : 'border-slate-200 bg-white text-slate-900 shadow-sm hover:-translate-y-0.5 hover:border-emerald-400 hover:shadow-md dark:border-slate-700 dark:bg-slate-900 dark:text-white',
          isNext && 'ring-2 ring-emerald-400 ring-offset-2 dark:ring-offset-slate-950',
        )}
      >
        <span
          className={cn(
            'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2',
            locked ? 'border-slate-300 dark:border-slate-600' : step.done ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300 dark:border-slate-600',
          )}
        >
          {locked ? <Lock className="h-3 w-3" /> : step.done ? <Check className="h-3.5 w-3.5" /> : null}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-semibold">{step.title}</span>
          {isNext && <span className="mt-0.5 block text-xs font-medium text-emerald-700 dark:text-emerald-400">Up next</span>}
        </span>
      </button>
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
    <div className="ml-8 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
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
