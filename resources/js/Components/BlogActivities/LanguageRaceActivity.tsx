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
/** Seconds for Python to cross one way at 1x. Very slow on purpose. */
const BASE_SECONDS = 48

/**
 * Relative speeds (Python = 1×): managed runtimes stay close;
 * Go pulls ahead; Rust is clearly ahead of Go.
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
    relative: 2,
    color: '#777BB4',
    seam: '#5B5F8F',
    logo: getImageUrl('/images/logos/tech/php-logo.svg'),
  },
  {
    id: 'javascript',
    name: 'JavaScript',
    relative: 4,
    color: '#F0DB4F',
    seam: '#C4B03A',
    logo: getImageUrl('/images/tech/nodejs.svg'),
  },
  {
    id: 'go',
    name: 'Go',
    relative: 25,
    color: '#00ADD8',
    seam: '#0089AB',
    logo: getImageUrl('/images/tech/go.svg'),
  },
  {
    id: 'rust',
    name: 'Rust',
    relative: 100,
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
  return `${relative}×`
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
  raceKey,
  duration,
  running,
  reducedMotion,
}: {
  lane: Lane
  raceKey: number
  duration: number
  running: boolean
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
      <div className="relative h-12 overflow-hidden rounded-full bg-slate-100">
        <div
          className="pointer-events-none absolute inset-y-[1.15rem] left-4 right-4 rounded-full bg-slate-200/80"
          aria-hidden="true"
        />
        <div
          key={`${lane.id}-${raceKey}`}
          data-race-ball={lane.id}
          className="absolute top-1/2 z-10 -translate-x-1/2 -translate-y-1/2"
          style={
            reducedMotion
              ? { left: '50%' }
              : running
                ? {
                    left: '1.25rem',
                    animation: `language-race-ball ${duration}s linear infinite alternate`,
                  }
                : { left: '1.25rem' }
          }
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
  const [auto, setAuto] = useState(false)
  const [playback, setPlayback] = useState(1)
  const [raceKey, setRaceKey] = useState(0)
  const [running, setRunning] = useState(false)

  const sliderValue = useMemo(() => playbackToSlider(playback), [playback])
  const caption = running
    ? 'Balls keep bouncing left and right at language speed. The slider only speeds up the picture.'
    : 'At 1x the balls crawl back and forth. Python is slowest. Drag the slider to speed up.'

  const restart = useCallback((nextPlayback?: number) => {
    if (typeof nextPlayback === 'number') {
      setPlayback(nextPlayback)
    }
    setRunning(true)
    setRaceKey((value) => value + 1)
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
    }, { threshold: 0.35 })

    observer.observe(node)
    document.addEventListener('visibilitychange', sync)

    return () => {
      observer.disconnect()
      document.removeEventListener('visibilitychange', sync)
    }
  }, [reducedMotion])

  useEffect(() => {
    if (!auto || running || reducedMotion !== false) {
      return
    }

    const timer = window.setTimeout(() => restart(), 220)

    return () => window.clearTimeout(timer)
  }, [auto, reducedMotion, restart, running])

  useEffect(() => {
    if (auto && running) {
      return
    }

    if (!auto && running && reducedMotion === false) {
      setRunning(false)
    }
  }, [auto, reducedMotion, running])

  return (
    <div ref={rootRef} className="not-prose rounded-3xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
      <style>{`
        @keyframes language-race-ball {
          from { left: 1.25rem; }
          to { left: calc(100% - 1.25rem); }
        }
      `}</style>
      <div className="mb-4">
        <p className="!my-0 text-sm font-semibold text-slate-950">Same work, five balls</p>
        <p className="!my-0 mt-1 text-sm text-slate-600">{caption}</p>
      </div>

      <div className="space-y-3.5">
        {LANES.map((lane) => (
          <LaneRow
            key={lane.id}
            lane={lane}
            raceKey={raceKey}
            duration={durationFor(lane.relative, playback)}
            running={running && reducedMotion === false}
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
          onChange={(event) => restart(sliderToPlayback(Number(event.target.value)))}
          className="mt-2 h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-slate-950"
        />
        <div className="mt-1 flex justify-between text-[0.65rem] text-slate-500">
          <span>0.5×</span>
          <span>1× default (slow)</span>
          <span>100×</span>
        </div>
      </div>
      <p className="!my-0 mt-2 text-xs text-slate-500">
        Language ratios stay 1× / 2× / 4× / 25× / 100×. Balls bounce forever. The slider only changes playback speed.
      </p>
    </div>
  )
}
