'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { useEffect, useMemo, useRef, useState } from 'react'
import { getImageUrl } from '@/lib/imageUtils'

type Lane = {
  id: string
  name: string
  /** Throughput vs Python on the n-body-style model. Python = 1. */
  relative: number
  logo: string
  ball: string
}

const PLAYBACK_MIN = 0.5
const PLAYBACK_MAX = 100
/** Wall time for the slowest ball (Python) when the slider is at 1x. */
const BASE_SECONDS = 14

/**
 * Relative speeds from Computer Language Benchmarks Game n-body wall times
 * (plain-ish stock entries): Python ~372s, PHP ~204s, Node ~9s, Go ~7s, Rust ~5.5s.
 * Rounded for the figure. Not a timing run from this site.
 */
const LANES: Lane[] = [
  {
    id: 'python',
    name: 'Python',
    relative: 1,
    logo: getImageUrl('/images/tech/python.svg'),
    ball: 'bg-[#3776AB]',
  },
  {
    id: 'php',
    name: 'PHP',
    relative: 1.8,
    logo: getImageUrl('/images/logos/tech/php-logo.svg'),
    ball: 'bg-[#777BB4]',
  },
  {
    id: 'javascript',
    name: 'JavaScript',
    relative: 40,
    logo: getImageUrl('/images/tech/nodejs.svg'),
    ball: 'bg-[#5FA04E]',
  },
  {
    id: 'go',
    name: 'Go',
    relative: 50,
    logo: getImageUrl('/images/tech/go.svg'),
    ball: 'bg-[#00ADD8]',
  },
  {
    id: 'rust',
    name: 'Rust',
    relative: 70,
    logo: getImageUrl('/images/logos/tech/rust-logo.svg'),
    ball: 'bg-[#DEA584]',
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
  if (relative < 10) {
    return `${relative}×`
  }

  return `${Math.round(relative)}×`
}

function LaneRow({
  lane,
  place,
  running,
  duration,
  reducedMotion,
}: {
  lane: Lane
  place: number | null
  running: boolean
  duration: number
  reducedMotion: boolean
}) {
  const finished = place !== null
  const atFinish = running || finished || reducedMotion

  return (
    <div className="grid grid-cols-[5.5rem_minmax(0,1fr)_2.5rem] items-center gap-x-2 sm:grid-cols-[6.5rem_minmax(0,1fr)_2.75rem]">
      <div className="min-w-0">
        <p className="!my-0 truncate text-sm font-semibold text-slate-950">{lane.name}</p>
        <p className="!my-0 text-[0.65rem] leading-4 text-slate-500">{formatRelative(lane.relative)}</p>
      </div>
      <div className="relative h-11 overflow-hidden rounded-full bg-slate-100">
        <div className="pointer-events-none absolute inset-y-3 left-3 right-3 rounded-full border border-dashed border-slate-200/80" aria-hidden="true" />
        <motion.div
          className="absolute top-1/2 z-10"
          style={{ x: '-50%', y: '-50%' }}
          initial={false}
          animate={{ left: atFinish ? 'calc(100% - 1.4rem)' : '1.4rem' }}
          transition={
            reducedMotion || !running
              ? { duration: 0 }
              : { duration, ease: 'linear' }
          }
        >
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-full shadow-md ring-2 ring-white ${lane.ball}`}
          >
            <img
              src={lane.logo}
              alt=""
              className="h-5 w-5 object-contain"
              loading="lazy"
              decoding="async"
            />
          </div>
        </motion.div>
      </div>
      <p className="!my-0 text-right text-sm font-semibold tabular-nums text-slate-950">
        {place ? `#${place}` : ''}
      </p>
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
  const [places, setPlaces] = useState<Record<string, number>>({})
  const [lap, setLap] = useState(0)

  const finished = Object.keys(places).length === LANES.length
  const sliderValue = useMemo(() => playbackToSlider(playback), [playback])
  const caption = finished
    ? 'Finish order is fixed in this model. The slider only changes how fast the picture moves.'
    : 'Same CPU-bound loop on stock runtimes. Ball speed follows relative throughput. Python is 1×.'

  const restart = (nextPlayback?: number) => {
    if (typeof nextPlayback === 'number') {
      setPlayback(nextPlayback)
    }
    setRunning(false)
    setPlaces({})
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

    const next: Record<string, number> = {}
    ;[...LANES]
      .sort((a, b) => b.relative - a.relative)
      .forEach((lane, index) => {
        next[lane.id] = index + 1
      })
    setPlaces(next)
    setRunning(false)
  }, [reducedMotion])

  useEffect(() => {
    if (!auto || running || reducedMotion !== false) {
      return
    }

    if (finished) {
      const timer = window.setTimeout(() => setPlaces({}), 2200)

      return () => window.clearTimeout(timer)
    }

    const timer = window.setTimeout(() => {
      setPlaces({})
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
        setPlaces((current) => {
          if (current[lane.id]) {
            return current
          }

          return { ...current, [lane.id]: Object.keys(current).length + 1 }
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

      <div className="space-y-3">
        {LANES.map((lane) => (
          <LaneRow
            key={`${lane.id}-${lap}`}
            lane={lane}
            place={places[lane.id] ?? null}
            running={running}
            duration={durationFor(lane.relative, playback)}
            reducedMotion={reducedMotion === true}
          />
        ))}
      </div>

      <div className="mt-4 border-t border-slate-200 pt-3">
        <div className="flex items-center justify-between gap-3">
          <label htmlFor="language-race-playback" className="!my-0 text-xs font-semibold text-slate-700">
            Playback
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
            const next = sliderToPlayback(Number(event.target.value))
            restart(next)
          }}
          className="mt-2 h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-slate-950"
        />
        <div className="mt-1 flex justify-between text-[0.65rem] text-slate-500">
          <span>0.5×</span>
          <span>100×</span>
        </div>
      </div>
      <p className="!my-0 mt-2 text-xs text-slate-500">
        Relative speeds follow n-body-style stock runtimes (Python = 1×). Slider is playback only.
      </p>
    </div>
  )
}
