'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import BlogActivityFrame, { type ActivityStep } from '@/Components/BlogActivities/BlogActivityFrame'
import { getImageUrl } from '@/lib/imageUtils'

type Tool = 'terraform' | 'pulumi'
type Stage = 'describe' | 'preview' | 'apply' | 'state'
type Phase = 'you' | 'hub' | 'terraform' | 'pulumi'

type Beat = {
  id: string
  stage: Stage
  tools: Tool[]
  title: string
  caption: string
  packetLabel: string
  barLabel: Record<Tool, string>
}

const SPEEDS = [0.5, 1, 2] as const

const LOGOS = {
  terraform: getImageUrl('/images/logos/tech/terraformio-icon.svg'),
  pulumi: getImageUrl('/images/logos/tech/pulumi-logo.svg'),
} as const

const STAGES: Stage[] = ['describe', 'preview', 'apply', 'state']

const STAGE_COPY: Record<Stage, { title: string; caption: string; packet: string; hub: string; bars: Record<Tool, string> }> = {
  describe: {
    title: 'Describe the resources',
    caption: 'Both tools start as a description of what should exist. Terraform uses HCL. Pulumi uses a language your app team already writes, often TypeScript.',
    packet: 'describe',
    hub: 'Write the desired state',
    bars: { terraform: 'main.tf', pulumi: 'index.ts' },
  },
  preview: {
    title: 'Preview the change',
    caption: 'terraform plan and pulumi preview list creates, updates, and deletes before anything changes. The review lives in that diff.',
    packet: 'preview',
    hub: 'Diff before apply',
    bars: { terraform: 'plan', pulumi: 'preview' },
  },
  apply: {
    title: 'Apply it',
    caption: 'Both call the cloud APIs and create the resources. The language does not skip this step. Do not apply from a laptop against production without the preview in the PR.',
    packet: 'apply',
    hub: 'Call the cloud APIs',
    bars: { terraform: 'apply', pulumi: 'up' },
  },
  state: {
    title: 'State records what exists',
    caption: 'Both keep state that maps your description to real resource IDs. That file can hold passwords and access keys. Lock it and limit who can read it.',
    packet: 'state',
    hub: 'Record real IDs',
    bars: { terraform: 'tfstate', pulumi: 'stack' },
  },
}

function makeBeat(stage: Stage, tools: Tool[]): Beat {
  const copy = STAGE_COPY[stage]

  return {
    id: `${stage}-${tools.join('-')}`,
    stage,
    tools,
    title: copy.title,
    caption: copy.caption,
    packetLabel: copy.packet,
    barLabel: copy.bars,
  }
}

function stageIndexFor(landed: Beat[], tool: Tool | 'both'): number {
  if (tool === 'both') {
    return landed.length % STAGES.length
  }

  return landed.filter((beat) => beat.tools.includes(tool)).length % STAGES.length
}

function nextBeat(landed: Beat[], choice: 'cycle' | Tool): Beat {
  if (choice === 'cycle') {
    return makeBeat(STAGES[stageIndexFor(landed, 'both')], ['terraform', 'pulumi'])
  }

  return makeBeat(STAGES[stageIndexFor(landed, choice)], [choice])
}

function Packet({ duration, label }: { duration: number; label?: string }) {
  if (label) {
    return (
      <motion.span
        className="absolute left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md bg-sky-500 px-1.5 py-0.5 text-[0.55rem] font-semibold leading-4 text-white shadow-sm"
        initial={{ top: 0 }}
        animate={{ top: 'calc(100% - 1.15rem)' }}
        transition={{ duration, ease: 'easeInOut' }}
      >
        {label}
      </motion.span>
    )
  }

  return (
    <motion.span
      className="absolute left-1/2 h-3 w-3 -translate-x-1/2 rounded-full bg-sky-500 shadow-[0_0_0_4px_rgba(14,165,233,0.25)]"
      initial={{ top: 0 }}
      animate={{ top: 'calc(100% - 0.75rem)' }}
      transition={{ duration, ease: 'easeInOut' }}
    />
  )
}

function LogoBadge({ src, alt, fallback }: { src?: string; alt: string; fallback: ReactNode }) {
  if (!src) {
    return (
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-slate-900 shadow-sm">
        {fallback}
      </span>
    )
  }

  return (
    <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-white shadow-sm">
      <img src={src} alt={alt} className="h-5 w-5 object-contain" loading="lazy" decoding="async" />
    </span>
  )
}

function IconButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string
  disabled?: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      data-activity-control="reset"
      onClick={onClick}
      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-900 disabled:cursor-not-allowed disabled:opacity-30"
    >
      {children}
    </button>
  )
}

function Column({
  name,
  note,
  hot,
  count,
  bars,
  packet,
  packetLabel,
  hopSeconds,
  reducedMotion,
  logoSrc,
}: {
  name: string
  note: string
  hot: boolean
  count: number
  bars: string[]
  packet: boolean
  packetLabel?: string
  hopSeconds: number
  reducedMotion: boolean
  logoSrc: string
}) {
  return (
    <div className="flex flex-col items-center">
      <div className={`relative h-8 w-px ${packet ? 'bg-sky-500' : 'bg-slate-300'}`}>
        {packet && !reducedMotion ? <Packet duration={hopSeconds} label={packetLabel} /> : null}
      </div>
      <div
        aria-label={name}
        className={`flex h-64 w-full flex-col overflow-hidden rounded-2xl md:h-72 ${hot ? 'bg-sky-700' : 'bg-slate-950'}`}
      >
        <div className="px-2 py-2">
          <div className="flex items-center gap-2">
            <LogoBadge src={logoSrc} alt={`${name} logo`} fallback={<span className="text-[0.55rem] font-bold">{name.slice(0, 2)}</span>} />
            <div className="min-w-0">
              <p className="!my-0 truncate text-sm font-semibold leading-5 text-white">{name}</p>
              <p className="!my-0 text-[0.65rem] leading-4 text-sky-100">{note}</p>
            </div>
            <p className="!my-0 ml-auto shrink-0 text-xl font-semibold tabular-nums leading-none text-white">{count}</p>
          </div>
        </div>
        <div className="flex min-h-0 flex-1 flex-col justify-end overflow-hidden px-2 pb-2">
          <div className="flex flex-col-reverse gap-1">
            {bars.slice(-12).map((label, index) => (
              <motion.span
                key={`${name}-${bars.length - bars.slice(-12).length + index}`}
                className="flex h-7 w-full items-center justify-center rounded-sm bg-sky-500 text-[0.55rem] font-semibold text-white"
                initial={reducedMotion ? false : { opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: reducedMotion ? 0 : 0.2 }}
              >
                {label}
              </motion.span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function TerraformPulumiActivity() {
  const reducedMotion = useReducedMotion()
  const rootRef = useRef<HTMLDivElement>(null)
  const onScreen = useRef(false)
  const [auto, setAuto] = useState(false)
  const [speed, setSpeed] = useState<(typeof SPEEDS)[number]>(1)
  const [landed, setLanded] = useState<Beat[]>([])
  const [choice, setChoice] = useState<'cycle' | Tool>('cycle')
  const [flight, setFlight] = useState<{ beat: Beat; phase: Phase } | null>(null)
  const hopSeconds = (reducedMotion ? 0.01 : 0.42) / speed
  const upcoming = nextBeat(landed, choice)
  const activeBeat = flight?.beat ?? upcoming
  const hub = STAGE_COPY[activeBeat.stage]
  const terraformSelected = choice === 'terraform'
  const pulumiSelected = choice === 'pulumi'
  const terraformBars = landed.flatMap((beat) => (beat.tools.includes('terraform') ? [beat.barLabel.terraform] : []))
  const pulumiBars = landed.flatMap((beat) => (beat.tools.includes('pulumi') ? [beat.barLabel.pulumi] : []))
  const last = landed[landed.length - 1]
  const step: ActivityStep = last
    ? { id: last.id, title: last.title, caption: last.caption, durationMs: 1 }
    : {
        id: 'empty',
        title: 'No applies yet',
        caption: 'Pick Terraform or Pulumi to stay on that side. Leave them and both tools walk describe, preview, apply, and state together.',
        durationMs: 1,
      }

  useEffect(() => {
    const node = rootRef.current

    if (!node || reducedMotion !== false) {
      setAuto(false)
      return
    }

    const sync = () => setAuto(onScreen.current && !document.hidden)
    const observer = new IntersectionObserver(([entry]) => {
      onScreen.current = entry.isIntersecting
      sync()
    }, { threshold: 0.35 })

    observer.observe(node)
    document.addEventListener('visibilitychange', sync)

    return () => {
      observer.disconnect()
      document.removeEventListener('visibilitychange', sync)
    }
  }, [reducedMotion])

  useEffect(() => {
    if (flight || (!auto && choice === 'cycle')) {
      return
    }

    const timer = window.setTimeout(() => {
      setFlight({ beat: nextBeat(landed, choice), phase: 'you' })
    }, choice === 'cycle' ? 180 / speed : 40)

    return () => window.clearTimeout(timer)
  }, [auto, choice, flight, landed, speed])

  useEffect(() => {
    if (!flight) {
      return
    }

    const hop = hopSeconds * 1000
    const tools = flight.beat.tools

    if (flight.phase === 'you') {
      const timer = window.setTimeout(() => setFlight({ ...flight, phase: 'hub' }), hop)

      return () => window.clearTimeout(timer)
    }

    if (flight.phase === 'hub') {
      const first = tools[0]
      const timer = window.setTimeout(() => setFlight({ ...flight, phase: first }), hop * 0.55)

      return () => window.clearTimeout(timer)
    }

    if (flight.phase === 'terraform' && tools.includes('pulumi') && tools.length > 1) {
      const timer = window.setTimeout(() => setFlight({ ...flight, phase: 'pulumi' }), hop * 0.55)

      return () => window.clearTimeout(timer)
    }

    const timer = window.setTimeout(() => {
      setLanded((current) => [...current, flight.beat])
      setFlight(null)
    }, hop)

    return () => window.clearTimeout(timer)
  }, [flight, hopSeconds])

  return (
    <div ref={rootRef}>
      <BlogActivityFrame
        title="Same loop, different language"
        steps={[step]}
        playback={false}
        renderStage={() => (
          <div>
            <div className="mx-auto flex w-full max-w-xl flex-col items-center">
              <div className={`flex items-center gap-2 rounded-full border px-3 py-1.5 ${flight?.phase === 'you' ? 'border-sky-500 bg-sky-50' : 'border-slate-200 bg-white'}`}>
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-950 text-white">
                  <svg width="16" height="16" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                    <circle cx="9" cy="6" r="2.4" stroke="currentColor" strokeWidth="1.6" />
                    <path d="M4.2 15.2c.7-2.4 2.5-3.6 4.8-3.6s4.1 1.2 4.8 3.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                  </svg>
                </span>
                <div>
                  <p className="!my-0 text-sm font-semibold text-slate-950">You</p>
                  <p className="!my-0 text-[0.65rem] leading-4 text-slate-500">infra change</p>
                </div>
              </div>

              <div className="relative h-10 w-px bg-slate-300">
                {flight?.phase === 'you' && !reducedMotion ? (
                  <Packet duration={hopSeconds} label={flight.beat.packetLabel} />
                ) : null}
              </div>

              <div className={`flex w-52 flex-col items-center rounded-2xl px-4 py-4 text-center text-white ${flight && flight.phase !== 'you' ? 'bg-sky-600' : 'bg-slate-950'}`}>
                <p className="!my-0 text-xs text-sky-100">{activeBeat.stage}</p>
                <p className="!my-0 mt-1 text-sm font-semibold leading-5">{hub.hub}</p>
              </div>

              <div className="h-4 w-px bg-slate-300" />

              <div className="relative grid w-full grid-cols-2 gap-3">
                <div className="pointer-events-none absolute top-0 right-[25%] left-[25%] h-px bg-slate-300" />
                <Column
                  name="Terraform"
                  note="HCL"
                  hot={flight?.phase === 'terraform'}
                  count={terraformBars.length}
                  bars={terraformBars}
                  packet={flight?.phase === 'terraform'}
                  packetLabel={flight?.beat.packetLabel}
                  hopSeconds={hopSeconds}
                  reducedMotion={reducedMotion === true}
                  logoSrc={LOGOS.terraform}
                />
                <Column
                  name="Pulumi"
                  note="TypeScript"
                  hot={flight?.phase === 'pulumi'}
                  count={pulumiBars.length}
                  bars={pulumiBars}
                  packet={flight?.phase === 'pulumi'}
                  packetLabel={flight?.beat.packetLabel}
                  hopSeconds={hopSeconds}
                  reducedMotion={reducedMotion === true}
                  logoSrc={LOGOS.pulumi}
                />
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-3">
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1" role="group" aria-label="Terraform or Pulumi">
                  <button
                    type="button"
                    data-activity-actor="terraform"
                    aria-pressed={terraformSelected}
                    onClick={() => setChoice((current) => (current === 'terraform' ? 'cycle' : 'terraform'))}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${
                      terraformSelected
                        ? 'bg-slate-950 text-white'
                        : choice === 'cycle' && activeBeat.tools.includes('terraform') && flight
                          ? 'border border-sky-500 bg-sky-50 text-sky-950'
                          : 'border border-slate-200 text-slate-700'
                    }`}
                  >
                    <img src={LOGOS.terraform} alt="" className="h-3.5 w-3.5 object-contain" />
                    Terraform
                  </button>
                  <button
                    type="button"
                    data-activity-actor="pulumi"
                    aria-pressed={pulumiSelected}
                    onClick={() => setChoice((current) => (current === 'pulumi' ? 'cycle' : 'pulumi'))}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${
                      pulumiSelected
                        ? 'bg-slate-950 text-white'
                        : choice === 'cycle' && activeBeat.tools.includes('pulumi') && flight
                          ? 'border border-sky-500 bg-sky-50 text-sky-950'
                          : 'border border-slate-200 text-slate-700'
                    }`}
                  >
                    <img src={LOGOS.pulumi} alt="" className="h-3.5 w-3.5 rounded-sm object-contain" />
                    Pulumi
                  </button>
                </div>
                <div className="flex items-center gap-1" role="group" aria-label="How fast requests arrive">
                  {SPEEDS.map((value) => (
                    <button
                      key={value}
                      type="button"
                      data-activity-speed={value}
                      aria-pressed={speed === value}
                      onClick={() => setSpeed(value)}
                      className={`rounded-full px-2.5 py-1.5 text-xs font-semibold ${
                        speed === value ? 'bg-slate-950 text-white' : 'border border-slate-200 text-slate-700'
                      }`}
                    >
                      {value}x
                    </button>
                  ))}
                </div>
              </div>
              <IconButton
                label="Reset"
                disabled={landed.length === 0 && !flight}
                onClick={() => {
                  setFlight(null)
                  setLanded([])
                  setChoice('cycle')
                }}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                  <path d="M2.2 7a4.8 4.8 0 1 0 1.2-3.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                  <path d="M2 2.2v3h3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </IconButton>
            </div>
            <p className="!my-0 mt-2 text-xs text-slate-500">
              {choice === 'terraform'
                ? 'Terraform stays selected. Each lap is describe, plan, apply, then state.'
                : choice === 'pulumi'
                  ? 'Pulumi stays selected. Each lap is describe, preview, up, then state.'
                  : 'Full cycle: both tools walk the same loop. Pick Terraform or Pulumi to stay there.'}
            </p>
          </div>
        )}
      />
    </div>
  )
}
