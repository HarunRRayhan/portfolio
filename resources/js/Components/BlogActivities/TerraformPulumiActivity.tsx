'use client'

import { useReducedMotion } from 'framer-motion'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { getImageUrl } from '@/lib/imageUtils'

type Line = {
  text: string
  tone?: 'cmd' | 'ok' | 'add' | 'muted'
}

type Step = {
  terraform: Line[]
  pulumi: Line[]
}

const SPEEDS = [0.5, 1, 2] as const

const LOGOS = {
  terraform: getImageUrl('/images/logos/tech/terraformio-icon.svg'),
  pulumi: getImageUrl('/images/logos/tech/pulumi-logo.svg'),
} as const

const STEPS: Step[] = [
  {
    terraform: [
      { text: '$ terraform plan -out=hrr.plan', tone: 'cmd' },
      { text: 'Plan: 1 to add, 0 to change, 0 to destroy.', tone: 'muted' },
      { text: '+ aws_s3_bucket.hrr_uploads', tone: 'add' },
    ],
    pulumi: [
      { text: '$ pulumi preview', tone: 'cmd' },
      { text: 'Previewing update (hrr-demo):', tone: 'muted' },
      { text: '+  aws:s3:Bucket hrrUploads', tone: 'add' },
    ],
  },
  {
    terraform: [
      { text: '$ terraform apply hrr.plan', tone: 'cmd' },
      { text: 'aws_s3_bucket.hrr_uploads: Creating...', tone: 'muted' },
      { text: 'Apply complete! Resources: 1 added.', tone: 'ok' },
    ],
    pulumi: [
      { text: '$ pulumi up --yes', tone: 'cmd' },
      { text: 'Updating (hrr-demo):', tone: 'muted' },
      { text: 'Resources: 1 created', tone: 'ok' },
    ],
  },
  {
    terraform: [
      { text: 'State → s3://hrr-terraform-state/.../terraform.tfstate', tone: 'muted' },
      { text: 'Lock held. Same bucket ID recorded.', tone: 'ok' },
    ],
    pulumi: [
      { text: 'State → remote stack (locked)', tone: 'muted' },
      { text: 'Same bucket ID recorded.', tone: 'ok' },
    ],
  },
]

function lineClass(tone: Line['tone']): string {
  if (tone === 'cmd') {
    return 'text-sky-300'
  }

  if (tone === 'ok') {
    return 'text-emerald-300'
  }

  if (tone === 'add') {
    return 'text-lime-300'
  }

  return 'text-slate-400'
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

function Terminal({
  name,
  note,
  logoSrc,
  lines,
  active,
}: {
  name: string
  note: string
  logoSrc: string
  lines: Line[]
  active: boolean
}) {
  return (
    <div className={`overflow-hidden rounded-2xl border ${active ? 'border-sky-400 shadow-[0_0_0_1px_rgba(56,189,248,0.35)]' : 'border-slate-800'}`}>
      <div className="flex items-center gap-2 border-b border-slate-800 bg-slate-900 px-3 py-2">
        <span className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-white">
          <img src={logoSrc} alt="" className="h-4 w-4 object-contain" />
        </span>
        <div className="min-w-0">
          <p className="!my-0 truncate text-sm font-semibold text-white">{name}</p>
          <p className="!my-0 text-[0.65rem] leading-4 text-slate-400">{note}</p>
        </div>
        <span className="ml-auto flex gap-1" aria-hidden="true">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-400/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
        </span>
      </div>
      <div className="min-h-52 bg-slate-950 px-3 py-3 font-mono text-[0.7rem] leading-5 md:min-h-56 md:text-xs">
        {lines.length === 0 ? (
          <p className="!my-0 text-slate-600">Waiting for deploy…</p>
        ) : (
          <div className="space-y-1">
            {lines.map((line, index) => (
              <p key={`${name}-${index}-${line.text}`} className={`!my-0 break-words ${lineClass(line.tone)}`}>
                {line.text}
              </p>
            ))}
            {active ? <span className="inline-block h-3 w-1.5 animate-pulse bg-sky-400 align-middle" aria-hidden="true" /> : null}
          </div>
        )}
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
  const [stepIndex, setStepIndex] = useState(0)
  const [lineIndex, setLineIndex] = useState(0)
  const [done, setDone] = useState(false)

  const terraformLines = STEPS.slice(0, stepIndex).flatMap((step) => step.terraform)
    .concat(STEPS[stepIndex] ? STEPS[stepIndex].terraform.slice(0, lineIndex) : [])
  const pulumiLines = STEPS.slice(0, stepIndex).flatMap((step) => step.pulumi)
    .concat(STEPS[stepIndex] ? STEPS[stepIndex].pulumi.slice(0, lineIndex) : [])
  const current = STEPS[stepIndex]
  const maxLines = current ? Math.max(current.terraform.length, current.pulumi.length) : 0
  const active = auto && !done && reducedMotion === false

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
    if (!auto || done || reducedMotion !== false || !current) {
      return
    }

    if (lineIndex >= maxLines) {
      if (stepIndex >= STEPS.length - 1) {
        const timer = window.setTimeout(() => setDone(true), 600 / speed)

        return () => window.clearTimeout(timer)
      }

      const timer = window.setTimeout(() => {
        setStepIndex((value) => value + 1)
        setLineIndex(0)
      }, 520 / speed)

      return () => window.clearTimeout(timer)
    }

    const timer = window.setTimeout(() => {
      setLineIndex((value) => value + 1)
    }, 520 / speed)

    return () => window.clearTimeout(timer)
  }, [auto, current, done, lineIndex, maxLines, reducedMotion, speed, stepIndex])

  useEffect(() => {
    if (reducedMotion === false) {
      return
    }

    setStepIndex(STEPS.length - 1)
    setLineIndex(Math.max(...STEPS.map((step) => Math.max(step.terraform.length, step.pulumi.length))))
    setDone(true)
  }, [reducedMotion])

  return (
    <div ref={rootRef} className="not-prose rounded-3xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
      <div className="mb-4">
        <p className="!my-0 text-sm font-semibold text-slate-950">Same deploy, two terminals</p>
        <p className="!my-0 mt-1 text-sm text-slate-600">
          Both tabs create <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[0.85em]">hrr-uploads-example</code>. Preview first, then apply, then lock state.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <Terminal
          name="Terraform"
          note="terraform plan → apply"
          logoSrc={LOGOS.terraform}
          lines={terraformLines}
          active={active && !done}
        />
        <Terminal
          name="Pulumi"
          note="pulumi preview → up"
          logoSrc={LOGOS.pulumi}
          lines={pulumiLines}
          active={active && !done}
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-3">
        <div className="flex items-center gap-1" role="group" aria-label="How fast the terminals type">
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
        <IconButton
          label="Reset"
          disabled={stepIndex === 0 && lineIndex === 0 && !done}
          onClick={() => {
            setStepIndex(0)
            setLineIndex(0)
            setDone(false)
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M2.2 7a4.8 4.8 0 1 0 1.2-3.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            <path d="M2 2.2v3h3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </IconButton>
      </div>
      <p className="!my-0 mt-2 text-xs text-slate-500">
        {done
          ? 'Both finished. Same bucket. Different language. Reset to watch again.'
          : 'The terminals type when this block is on screen. Same resource, same outcome.'}
      </p>
    </div>
  )
}
