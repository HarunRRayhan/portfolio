'use client'

import { useReducedMotion } from 'framer-motion'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getImageUrl } from '@/lib/imageUtils'

type Lane = {
  id: string
  name: string
  /** Relative throughput. Python = 1. */
  relative: number
  color: string
  seam: string
  logo: string
}

const PLAYBACK_MIN = 0.5
const PLAYBACK_MAX = 100
/**
 * Seconds for Python to cross one way at 1x playback.
 * 100x on the slider restores the watchable pace (~48s for Python).
 */
const BASE_SECONDS = 4800
/** Horizontal inset from each track edge to the ball center (1.25rem). */
const TRACK_INSET_PX = 20

/**
 * Relative throughput vs Python on the Computer Language Benchmarks Game
 * n-body task (best elapsed secs → Python_secs / lang_secs, rounded).
 * Source: https://benchmarksgame-team.pages.debian.net/benchmarksgame/performance/nbody.html
 * Python 372.41s, PHP #3 204.10s, Node #6 8.55s, Go #3 6.39s, Rust #3 3.46s.
 */
const LANES: Lane[] = [
  {
    id: 'python',
    name: 'Python',
    relative: 1,
    color: '#3776AB',
    seam: '#2A5A85',
    logo: getImageUrl('/images/tech/python.svg'),
  },
  {
    id: 'php',
    name: 'PHP',
    relative: 1.8,
    color: '#777BB4',
    seam: '#5B5F8F',
    logo: getImageUrl('/images/logos/tech/php-logo.svg'),
  },
  {
    id: 'javascript',
    name: 'JavaScript',
    relative: 44,
    color: '#F0DB4F',
    seam: '#C4B03A',
    logo: getImageUrl('/images/tech/nodejs.svg'),
  },
  {
    id: 'go',
    name: 'Go',
    relative: 58,
    color: '#00ADD8',
    seam: '#0089AB',
    logo: getImageUrl('/images/tech/go.svg'),
  },
  {
    id: 'rust',
    name: 'Rust',
    relative: 108,
    color: '#DEA584',
    seam: '#B07D5C',
    logo: getImageUrl('/images/logos/tech/rust-logo.svg'),
  },
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
  if (Number.isInteger(relative)) {
    return `${relative}×`
  }

  return `${relative.toFixed(1)}×`
}

/** Triangle wave 0→1→0… so the ball never stops at either end. */
function pingPongProgress(elapsedSeconds: number, oneWaySeconds: number): number {
  const cycle = elapsedSeconds / Math.max(oneWaySeconds, 0.001)
  const phase = cycle % 2

  return phase <= 1 ? phase : 2 - phase
}

function TennisBall({ color, seam }: { color: string; seam: string }) {
  return (
    <span
      className="relative block h-9 w-9 shrink-0 rounded-full"
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
  ballRef,
  reducedMotion,
}: {
  lane: Lane
  ballRef: (node: HTMLDivElement | null) => void
  reducedMotion: boolean
}) {
  return (
    <div className="grid grid-cols-[7.75rem_minmax(0,1fr)] items-center gap-x-3 sm:grid-cols-[9rem_minmax(0,1fr)]">
      <div className="flex min-w-0 items-center gap-2">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white shadow-sm ring-1 ring-slate-200">
          <img
            src={lane.logo}
            alt=""
            className="h-5 w-5 object-contain"
            loading="lazy"
            decoding="async"
          />
        </span>
        <div className="min-w-0">
          <p className="!my-0 truncate text-sm font-semibold text-slate-950">{lane.name}</p>
          <p className="!my-0 text-[0.7rem] leading-4 tabular-nums text-slate-500">
            {formatRelative(lane.relative)}
          </p>
        </div>
      </div>
      <div data-race-track={lane.id} className="relative h-12 overflow-hidden rounded-full bg-slate-100">
        <div
          className="pointer-events-none absolute inset-y-[1.15rem] left-4 right-4 rounded-full bg-slate-200/80"
          aria-hidden="true"
        />
        <div
          ref={ballRef}
          data-race-ball={lane.id}
          className="absolute top-1/2 z-10"
          style={{
            left: TRACK_INSET_PX,
            transform: reducedMotion
              ? 'translate3d(0, -50%, 0) translateX(-50%)'
              : 'translate3d(0, -50%, 0) translateX(-50%)',
          }}
        >
          <TennisBall color={lane.color} seam={lane.seam} />
        </div>
      </div>
    </div>
  )
}

export default function LanguageRaceActivity() {
  const reducedMotion = useReducedMotion()
  const rootRef = useRef<HTMLDivElement>(null)
  const onScreen = useRef(false)
  const startedAtRef = useRef<number | null>(null)
  const playbackRef = useRef(1)
  const ballsRef = useRef<Record<string, HTMLDivElement | null>>({})
  const [auto, setAuto] = useState(false)
  const [playback, setPlayback] = useState(1)
  const [running, setRunning] = useState(false)

  playbackRef.current = playback

  const sliderValue = useMemo(() => playbackToSlider(playback), [playback])
  const caption = running
    ? 'Balls run left to right, then reverse, forever. 1× crawls. 100× is full race speed.'
    : 'At 1× each ball barely crawls. Slide to 100× for the full race speed (today’s old 1× pace).'

  const setBallRef = useCallback((id: string) => (node: HTMLDivElement | null) => {
    ballsRef.current[id] = node
  }, [])

  useEffect(() => {
    const node = rootRef.current

    if (!node || reducedMotion !== false) {
      setAuto(false)
      setRunning(false)
      return
    }

    const sync = () => setAuto(onScreen.current && !document.hidden)
    const observer = new IntersectionObserver(([entry]) => {
      onScreen.current = entry.isIntersecting
      sync()
    }, { threshold: 0.15 })

    observer.observe(node)
    document.addEventListener('visibilitychange', sync)

    return () => {
      observer.disconnect()
      document.removeEventListener('visibilitychange', sync)
    }
  }, [reducedMotion])

  useEffect(() => {
    if (reducedMotion !== false) {
      setRunning(false)
      startedAtRef.current = null
      return
    }

    if (auto) {
      setRunning(true)
      if (startedAtRef.current === null) {
        startedAtRef.current = performance.now()
      }
      return
    }

    setRunning(false)
  }, [auto, reducedMotion])

  useEffect(() => {
    if (reducedMotion === true) {
      LANES.forEach((lane) => {
        const ball = ballsRef.current[lane.id]
        const track = ball?.parentElement
        if (!ball || !track) {
          return
        }
        const travel = Math.max(0, track.clientWidth - TRACK_INSET_PX * 2)
        ball.style.transform = `translate3d(${travel / 2}px, -50%, 0) translateX(-50%)`
      })
      return
    }

    if (!running) {
      LANES.forEach((lane) => {
        const ball = ballsRef.current[lane.id]
        if (!ball) {
          return
        }
        ball.style.transform = 'translate3d(0, -50%, 0) translateX(-50%)'
      })
      return
    }

    let frame = 0
    const tick = (now: number) => {
      const startedAt = startedAtRef.current ?? now
      startedAtRef.current = startedAt
      const elapsed = (now - startedAt) / 1000
      const rate = playbackRef.current

      LANES.forEach((lane) => {
        const ball = ballsRef.current[lane.id]
        const track = ball?.parentElement
        if (!ball || !track) {
          return
        }
        const travel = Math.max(0, track.clientWidth - TRACK_INSET_PX * 2)
        const oneWay = durationFor(lane.relative, rate)
        const progress = pingPongProgress(elapsed, oneWay)
        ball.style.transform = `translate3d(${progress * travel}px, -50%, 0) translateX(-50%)`
      })

      frame = window.requestAnimationFrame(tick)
    }

    frame = window.requestAnimationFrame(tick)

    return () => window.cancelAnimationFrame(frame)
  }, [reducedMotion, running])

  return (
    <div ref={rootRef} className="not-prose rounded-3xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
      <div className="mb-4">
        <p className="!my-0 text-sm font-semibold text-slate-950">Same work, five balls</p>
        <p className="!my-0 mt-1 text-sm text-slate-600">{caption}</p>
      </div>

      <div className="space-y-3.5">
        {LANES.map((lane) => (
          <LaneRow
            key={lane.id}
            lane={lane}
            ballRef={setBallRef(lane.id)}
            reducedMotion={reducedMotion === true}
          />
        ))}
      </div>

      <div className="mt-4 border-t border-slate-200 pt-3">
        <div className="flex items-center justify-between gap-3">
          <label htmlFor="language-race-playback" className="!my-0 text-xs font-semibold text-slate-700">
            Speed up the animation
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
          onChange={(event) => setPlayback(sliderToPlayback(Number(event.target.value)))}
          className="mt-2 h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-slate-950"
        />
        <div className="mt-1 flex justify-between text-[0.65rem] text-slate-500">
          <span>0.5×</span>
          <span>1× crawl</span>
          <span>100× full speed</span>
        </div>
      </div>
      <p className="!my-0 mt-2 text-xs text-slate-500">
        Ratios follow Benchmarks Game n-body vs Python (1× / 1.8× / 44× / 58× / 108×). Each ball reverses at the end. The slider only changes playback speed.
      </p>
    </div>
  )
}
