'use client'

import { useReducedMotion } from 'framer-motion'
import { useCallback, useEffect, useId, useState, type ReactNode } from 'react'

export type ActivityStep = {
  id: string
  title: string
  caption: string
  durationMs: number
}

const SPEEDS = [0.5, 1, 2] as const

export type ActivityFrameApi = {
  stepIndex: number
  setStepIndex: (index: number) => void
}

type BlogActivityFrameProps = {
  title: string
  steps: ActivityStep[]
  renderStage: (stepIndex: number, speed: number) => ReactNode
  detail?: string
  onStepIndexChange?: (index: number) => void
  footer?: (api: ActivityFrameApi) => ReactNode
  playback?: boolean
}

export default function BlogActivityFrame({
  title,
  steps,
  renderStage,
  detail,
  onStepIndexChange,
  footer,
  playback = true,
}: BlogActivityFrameProps) {
  const reducedMotion = useReducedMotion()
  const allowAutoplay = reducedMotion === false
  const [stepIndex, setStepIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState<(typeof SPEEDS)[number]>(1)
  const titleId = useId()
  const safeIndex = Math.min(stepIndex, Math.max(steps.length - 1, 0))
  const step = steps[safeIndex]

  useEffect(() => {
    if (playback && allowAutoplay) {
      setPlaying(true)
    }
  }, [allowAutoplay, playback])

  useEffect(() => {
    onStepIndexChange?.(safeIndex)
  }, [onStepIndexChange, safeIndex])

  const advance = useCallback(
    (source: 'auto' | 'button') => {
      const last = steps.length - 1

      if (safeIndex < last) {
        setStepIndex(safeIndex + 1)
        return
      }

      if (source === 'auto') {
        setStepIndex(0)
        return
      }

      setPlaying(false)
    },
    [safeIndex, steps.length],
  )

  const retreat = useCallback(() => {
    setStepIndex((current) => (current > 0 ? current - 1 : 0))
  }, [])

  useEffect(() => {
    if (!playing || !step) {
      return
    }

    const dwell = step.durationMs / speed
    const timer = window.setTimeout(() => advance('auto'), dwell)

    return () => window.clearTimeout(timer)
  }, [advance, playing, speed, step])

  const jumpTo = useCallback((index: number) => {
    setStepIndex(Math.min(Math.max(index, 0), steps.length - 1))
  }, [steps.length])

  return (
    <section
      aria-labelledby={titleId}
      tabIndex={0}
      data-activity-frame=""
      onKeyDown={(event) => {
        if (!playback) {
          return
        }

        if (event.key === 'ArrowRight') {
          event.preventDefault()
          advance('button')
        }

        if (event.key === 'ArrowLeft') {
          event.preventDefault()
          retreat()
        }
      }}
      className="my-8 rounded-2xl border border-slate-200 bg-white shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
        <p id={titleId} className="!my-0 text-base font-semibold tracking-tight text-slate-950">
          {title}
        </p>
        {playback ? (
          <p className="!my-0 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            {safeIndex + 1} / {steps.length}
          </p>
        ) : null}
      </div>

      <div className="min-h-[280px] px-4 py-5">{step ? renderStage(safeIndex, speed) : null}</div>

      <div className="space-y-2 border-t border-slate-200 px-4 py-4">
        <p className="!my-0 text-sm font-semibold text-slate-950" data-activity-step-title="">
          {step?.title}
        </p>
        <p className="!my-0 text-sm leading-6 text-slate-600" data-activity-caption="">
          {step?.caption}
        </p>
        {detail ? <p className="!my-0 text-sm leading-6 text-slate-800">{detail}</p> : null}
      </div>

      {playback ? <div className="flex flex-wrap items-center gap-2 border-t border-slate-200 px-4 py-3">
        <button
          type="button"
          data-activity-play=""
          aria-pressed={playing}
          onClick={() => setPlaying((current) => !current)}
          className="rounded-full bg-slate-950 px-3 py-1.5 text-xs font-semibold text-white"
        >
          {playing ? 'Pause' : 'Play'}
        </button>
        <button
          type="button"
          data-activity-previous=""
          onClick={retreat}
          className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-800"
        >
          Previous
        </button>
        <button
          type="button"
          data-activity-next=""
          onClick={() => advance('button')}
          className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-800"
        >
          Next
        </button>
        <div className="ml-auto flex items-center gap-1" role="group" aria-label="Playback speed">
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
      </div> : null}

      {footer ? (
        <div className="flex flex-wrap gap-2 border-t border-slate-200 px-4 py-3">
          {footer({ stepIndex: safeIndex, setStepIndex: jumpTo })}
        </div>
      ) : null}
    </section>
  )
}
