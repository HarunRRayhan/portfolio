'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { useEffect, useMemo, useRef, useState } from 'react'

type Lane = {
  id: string
  name: string
  /** Throughput vs CPython on the n-body model. Python = 1. */
  relative: number
  /** Ball fill color. */
  color: string
  /** Darker seam / shadow tint. */
  seam: string
}

const PLAYBACK_MIN = 0.5
const PLAYBACK_MAX = 100
/** Wall time for the slowest ball (Python) when the slider is at 1x. */
const BASE_SECONDS = 14

/**
 * Relative speeds from Computer Language Benchmarks Game n-body wall times
 * (plain-ish stock entries): Python ~372s, PHP ~204s, Node ~9s, Go ~7s, Rust ~5.5s.
 * Rounded. Not a timing run from this site.
 */
const LANES: Lane[] = [
  { id: 'python', name: 'Python', relative: 1, color: '#3776AB', seam: '#2A5A85' },
  { id: 'php', name: 'PHP', relative: 1.8, color: '#777BB4', seam: '#5B5F8F' },
  { id: 'javascript', name: 'JavaScript', relative: 40, color: '#F0DB4F', seam: '#C4B03A' },
  { id: 'go', name: 'Go', relative: 53, color: '#00ADD8', seam: '#0089AB' },
  { id: 'rust', name: 'Rust', relative: 68, color: '#DEA584', seam: '#B07D5C' },
]

function durationFor(relative: number, playback: number): number {
  return BASE_SECONDS / relative / playback
}

function playbackToSlider(playback: number): number {
  const t = Math.log(playback / PLAYBACK_MIN) / Math.log(PLAYBACK_MAX / PLAYBACK_MIN)

  return Math.round(Math.min(1, Math.max(0, t)) * 1000)
}

function sliderToPlayback(position: number): number {
  const t = Math.min(1000, Math.max(0, position)) / 1000

  return PLAYBACK_MIN * (PLAYBACK_MAX / PLAYBACK_MIN) ** t
}

function formatPlayback(playback: number): string {
  if (playback < 10) {
    return `${playback.toFixed(playback < 1 ? 2 : 1)}x`
  }

  return `${Math.round(playback)}x`
}

function formatRelative(relative: number): string {
  if (relative < 10) {
    return `${relative}×`
  }

  return `${Math.round(relative)}×`
}

function TennisBall({ color, seam }: { color: string; seam: string }) {
  return (
    <span
      className="relative block h-9 w-9 shrink-0 rounded-full shadow-md"
      style={{
        background: `radial-gradient(circle at 32% 28%, #ffffffaa 0%, ${color} 42%, ${seam} 100%)`,
        boxShadow: `inset -2px -3px 6px ${seam}88, 0 2px 4px rgb(15 23 42 / 0.18)`,
      }}
      aria-hidden="true"
    >
      <span
        className="absolute inset-[18%] rounded-full border-2 border-transparent"
        style={{
          borderLeftColor: `${seam}cc`,
          borderRightColor: `${seam}cc`,
          transform: 'rotate(18deg)',
        }}
      />
    </span>
  )
}

function LaneRow({
  lane,
  arrived,
  running,
  duration,
  reducedMotion,
}: {
  lane: Lane
  arrived: boolean
  running: boolean
  duration: number
  reducedMotion: boolean
}) {
  const atFinish = running || arrived || reducedMotion

  return (
    <div className="grid grid-cols-[6.25rem_minmax(0,1fr)] items-center gap-x-3 sm:grid-cols-[7.5rem_minmax(0,1fr)]">
      <div className="min-w-0">
        <p className="!my-0 truncate text-sm font-semibold text-slate-950">{lane.name}</p>
        <p className="!my-0 text-[0.7rem] leading-4 tabular-nums text-slate-500">
          {formatRelative(lane.relative)} vs Python
        </p>
      </div>
      <div className="relative h-12 overflow-hidden rounded-full bg-slate-100">
        <div
          className="pointer-events-none absolute inset-y-[1.15rem] left-4 right-4 rounded-full bg-slate-200/80"
          aria-hidden="true"
        />
        <motion.div
          className="absolute top-1/2 z-10"
          style={{ x: '-50%', y: '-50%' }}
          initial={false}
          animate={{ left: atFinish ? 'calc(100% - 1.35rem)' : '1.35rem' }}
          transition={
            reducedMotion || !running
              ? { duration: 0 }
              : { duration, ease: 'linear' }
          }
        >
          <TennisBall color={lane.color} seam={lane.seam} />
        </motion.div>
      </div>
    </div>
  )
}

export default function LanguageRaceActivity() {
  const reducedMotion = useReducedMotion()
  const rootRef = useRef<HTMLDivElement>(null)
  const onScreen = useRef(false)
  const [auto, setAuto] = useState(false)
  const [playback, setPlayback] = useState(1)
  const [running, setRunning] = useState(false)
  const [arrived, setArrived] = useState<Record<string, true>>({})
  const [lap, setLap] = useState(0)

  const finished = Object.keys(arrived).length === LANES.length
  const sliderValue = useMemo(() => playbackToSlider(playback), [playback])
  const caption = finished
    ? 'Ball speed is fixed by the language ratios. The slider only changes how fast the picture moves.'
    : "Each ball crosses left to right at that language's speed vs CPython. Python is 1×."

  const restart = (nextPlayback?: number) => {
    if (typeof nextPlayback === 'number') {
      setPlayback(nextPlayback)
    }
    setRunning(false)
    setArrived({})
    setLap((value) => value + 1)
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
    if (reducedMotion !== true) {
      return
    }

    const next: Record<string, true> = {}
    LANES.forEach((lane) => {
      next[lane.id] = true
    })
    setArrived(next)
    setRunning(false)
  }, [reducedMotion])

  useEffect(() => {
    if (!auto || running || reducedMotion !== false) {
      return
    }

    if (finished) {
      const timer = window.setTimeout(() => setArrived({}), 2200)

      return () => window.clearTimeout(timer)
    }

    const timer = window.setTimeout(() => {
      setArrived({})
      setRunning(true)
      setLap((value) => value + 1)
    }, 180)

    return () => window.clearTimeout(timer)
  }, [auto, finished, reducedMotion, running])

  useEffect(() => {
    if (!running || reducedMotion !== false) {
      return
    }

    const timers = LANES.map((lane) => {
      const ms = durationFor(lane.relative, playback) * 1000

      return window.setTimeout(() => {
        setArrived((current) => {
          if (current[lane.id]) {
            return current
          }

          return { ...current, [lane.id]: true }
        })
      }, ms)
    })

    const longest = Math.max(...LANES.map((lane) => durationFor(lane.relative, playback))) * 1000 + 40
    const done = window.setTimeout(() => setRunning(false), longest)

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer))
      window.clearTimeout(done)
    }
  }, [lap, playback, reducedMotion, running])

  return (
    <div ref={rootRef} className="not-prose rounded-3xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
      <div className="mb-4">
        <p className="!my-0 text-sm font-semibold text-slate-950">Same work, five balls</p>
        <p className="!my-0 mt-1 text-sm text-slate-600">{caption}</p>
      </div>

      <div className="space-y-3.5">
        {LANES.map((lane) => (
          <LaneRow
            key={`${lane.id}-${lap}`}
            lane={lane}
            arrived={arrived[lane.id] === true}
            running={running}
            duration={durationFor(lane.relative, playback)}
            reducedMotion={reducedMotion === true}
          />
        ))}
      </div>

      <div className="mt-4 border-t border-slate-200 pt-3">
        <div className="flex items-center justify-between gap-3">
          <label htmlFor="language-race-playback" className="!my-0 text-xs font-semibold text-slate-700">
            Speed up
          </label>
          <p className="!my-0 text-sm font-semibold tabular-nums text-slate-950" data-activity-playback="">
            {formatPlayback(playback)}
          </p>
        </div>
        <input
          id="language-race-playback"
          type="range"
          min={0}
          max={1000}
          step={1}
          value={sliderValue}
          aria-valuemin={PLAYBACK_MIN}
          aria-valuemax={PLAYBACK_MAX}
          aria-valuenow={Number(playback.toFixed(2))}
          aria-valuetext={formatPlayback(playback)}
          data-activity-speed-slider=""
          onChange={(event) => {
            restart(sliderToPlayback(Number(event.target.value)))
          }}
          className="mt-2 h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-slate-950"
        />
        <div className="mt-1 flex justify-between text-[0.65rem] text-slate-500">
          <span>0.5×</span>
          <span>100×</span>
        </div>
      </div>
      <p className="!my-0 mt-2 text-xs text-slate-500">
        Ratios from Benchmarks Game n-body (CPython = 1×). Slider only speeds up the animation.
      </p>
    </div>
  )
}
