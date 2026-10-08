'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { getImageUrl } from '@/lib/imageUtils'

type Lane = {
  id: string
  name: string
  cost: string
  detail: string
  /** Relative throughput score; higher finishes sooner in the model. */
  score: number
  logo: string
  color: string
}

const SPEEDS = [0.5, 1, 2] as const
const BASE_SECONDS = 3.6

const LANES: Lane[] = [
  {
    id: 'python',
    name: 'Python',
    cost: 'Interpreter',
    detail: 'Reads opcodes as it runs',
    score: 58,
    logo: getImageUrl('/images/tech/python.svg'),
    color: 'bg-amber-500',
  },
  {
    id: 'php',
    name: 'PHP',
    cost: 'Interpreter',
    detail: 'Same class of loop tax',
    score: 64,
    logo: getImageUrl('/images/logos/tech/php-logo.svg'),
    color: 'bg-indigo-400',
  },
  {
    id: 'javascript',
    name: 'JavaScript',
    cost: 'JIT',
    detail: 'Hot loop compiles after warmup',
    score: 76,
    logo: getImageUrl('/images/tech/nodejs.svg'),
    color: 'bg-lime-500',
  },
  {
    id: 'go',
    name: 'Go',
    cost: 'GC',
    detail: 'Compiled, then collector scans',
    score: 90,
    logo: getImageUrl('/images/tech/go.svg'),
    color: 'bg-sky-500',
  },
  {
    id: 'rust',
    name: 'Rust',
    cost: 'No GC',
    detail: 'Compiled, this loop does not pause',
    score: 100,
    logo: getImageUrl('/images/logos/tech/rust-logo.svg'),
    color: 'bg-orange-500',
  },
]

function durationFor(score: number, speed: number): number {
  return (BASE_SECONDS * (100 / score)) / speed
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

  return (
    <div className="grid grid-cols-[7.5rem_minmax(0,1fr)_2.5rem] items-center gap-x-2 gap-y-1 sm:grid-cols-[9rem_minmax(0,1fr)_2.75rem]">
      <div className="flex min-w-0 items-center gap-2">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white shadow-sm ring-1 ring-slate-200">
          <img src={lane.logo} alt="" className="h-5 w-5 object-contain" loading="lazy" decoding="async" />
        </span>
        <div className="min-w-0">
          <p className="!my-0 truncate text-sm font-semibold text-slate-950">{lane.name}</p>
          <p className="!my-0 truncate text-[0.65rem] leading-4 text-slate-500">{lane.cost}</p>
        </div>
      </div>
      <div>
        <div className="h-3 overflow-hidden rounded-full bg-slate-100">
          <motion.div
            className={`h-full rounded-full ${lane.color}`}
            initial={false}
            animate={{ width: running || finished || reducedMotion ? '100%' : '4%' }}
            transition={
              reducedMotion || !running
                ? { duration: 0 }
                : { duration, ease: 'linear' }
            }
          />
        </div>
        <p className="!my-0 mt-1 text-[0.65rem] leading-4 text-slate-500">{lane.detail}</p>
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
  const [speed, setSpeed] = useState<(typeof SPEEDS)[number]>(1)
  const [running, setRunning] = useState(false)
  const [places, setPlaces] = useState<Record<string, number>>({})
  const [lap, setLap] = useState(0)

  const finished = Object.keys(places).length === LANES.length
  const caption = finished
    ? 'Finish order is fixed in this model. Faster playback does not change who wins. This is not a laptop benchmark.'
    : 'Same small CPU loop: count, allocate, hash. Each lane pays a different runtime tax.'

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
      .sort((a, b) => b.score - a.score)
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
      const ms = durationFor(lane.score, speed) * 1000

      return window.setTimeout(() => {
        setPlaces((current) => {
          if (current[lane.id]) {
            return current
          }

          const place = Object.keys(current).length + 1

          return { ...current, [lane.id]: place }
        })
      }, ms)
    })

    const longest = Math.max(...LANES.map((lane) => durationFor(lane.score, speed))) * 1000 + 40
    const done = window.setTimeout(() => setRunning(false), longest)

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer))
      window.clearTimeout(done)
    }
  }, [lap, reducedMotion, running, speed])

  return (
    <div ref={rootRef} className="not-prose rounded-3xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
      <div className="mb-4">
        <p className="!my-0 text-sm font-semibold text-slate-950">Same work, five lanes</p>
        <p className="!my-0 mt-1 text-sm text-slate-600">{caption}</p>
      </div>

      <div className="space-y-4">
        {LANES.map((lane) => (
          <LaneRow
            key={`${lane.id}-${lap}`}
            lane={lane}
            place={places[lane.id] ?? null}
            running={running}
            duration={durationFor(lane.score, speed)}
            reducedMotion={reducedMotion === true}
          />
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-3">
        <div className="flex items-center gap-1" role="group" aria-label="How fast the race runs">
          {SPEEDS.map((value) => (
            <button
              key={value}
              type="button"
              data-activity-speed={value}
              aria-pressed={speed === value}
              onClick={() => {
                setSpeed(value)
                if (running || finished) {
                  setRunning(false)
                  setPlaces({})
                  setLap((current) => current + 1)
                }
              }}
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
          disabled={!running && !finished}
          onClick={() => {
            setRunning(false)
            setPlaces({})
            setLap((value) => value + 1)
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M2.2 7a4.8 4.8 0 1 0 1.2-3.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            <path d="M2 2.2v3h3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </IconButton>
      </div>
      <p className="!my-0 mt-2 text-xs text-slate-500">
        Order stays Rust, Go, JavaScript, PHP, Python. Reset clears the lap. Speed only changes how fast the picture moves.
      </p>
    </div>
  )
}
