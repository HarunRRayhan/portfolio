'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import BlogActivityFrame, { type ActivityStep } from '@/Components/BlogActivities/BlogActivityFrame'

type Actor = 'browser' | 'api'
type Phase = 'you' | 'hub' | 'browser' | 'api' | 's3'
type Tone = 'deny' | 'ok' | 'sign'

type Beat = {
  id: string
  actor: Actor
  tone: Tone
  title: string
  caption: string
}

const SPEEDS = [0.5, 1, 2] as const

const BEATS: Beat[] = [
  {
    id: 'direct',
    actor: 'browser',
    tone: 'deny',
    title: 'The browser asked S3',
    caption: 'No signature on the request. S3 answers 403. The object stays private.',
  },
  {
    id: 'sign',
    actor: 'api',
    tone: 'sign',
    title: 'The API signs one URL',
    caption: 'The API holds the credentials. It signs one GET, one key, and an expiry. The file does not move.',
  },
  {
    id: 'fetch',
    actor: 'browser',
    tone: 'ok',
    title: 'The browser uses that URL',
    caption: 'The signed request goes from the browser to S3. The API is not in the middle. S3 answers 200.',
  },
  {
    id: 'expired',
    actor: 'browser',
    tone: 'deny',
    title: 'The same URL is dead',
    caption: 'The expiry passed. The browser tries the same URL and S3 answers 403.',
  },
  {
    id: 'public',
    actor: 'browser',
    tone: 'ok',
    title: 'A public object stays open',
    caption: 'The browser asks S3 directly and gets 200. The same request tomorrow would get 200 too.',
  },
]

function nextBeat(landed: Beat[], forced: Actor | null): Beat {
  if (forced === 'api') {
    return BEATS[1]
  }

  if (forced === 'browser') {
    const sawSign = landed.some((beat) => beat.id === 'sign')
    const sawFetch = landed.some((beat) => beat.id === 'fetch')
    const sawExpired = landed.some((beat) => beat.id === 'expired')

    if (!sawSign) {
      return BEATS[0]
    }

    if (!sawFetch) {
      return BEATS[2]
    }

    if (!sawExpired) {
      return BEATS[3]
    }

    return BEATS[4]
  }

  return BEATS[landed.length % BEATS.length]
}

function Packet({ duration }: { duration: number }) {
  return (
    <motion.span
      className="absolute left-1/2 h-3 w-3 -translate-x-1/2 rounded-full bg-sky-500 shadow-[0_0_0_4px_rgba(14,165,233,0.25)]"
      initial={{ top: 0 }}
      animate={{ top: 'calc(100% - 0.75rem)' }}
      transition={{ duration, ease: 'easeInOut' }}
    />
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

function barClass(tone: Tone): string {
  if (tone === 'deny') {
    return 'bg-rose-500'
  }

  if (tone === 'ok') {
    return 'bg-emerald-500'
  }

  return 'bg-sky-500'
}

function Column({
  name,
  note,
  hot,
  count,
  bars,
  packet,
  hopSeconds,
  reducedMotion,
}: {
  name: string
  note: string
  hot: boolean
  count: number
  bars: Beat[]
  packet: boolean
  hopSeconds: number
  reducedMotion: boolean
}) {
  return (
    <div className="flex flex-col items-center">
      <div className={`relative h-8 w-px ${packet ? 'bg-sky-500' : 'bg-slate-300'}`}>
        {packet && !reducedMotion ? <Packet duration={hopSeconds} /> : null}
      </div>
      <div
        aria-label={name}
        className={`flex h-64 w-full flex-col overflow-hidden rounded-2xl md:h-72 ${hot ? 'bg-sky-700' : 'bg-slate-950'}`}
      >
        <div className="px-2 py-2">
          <p className="!my-0 text-sm font-semibold leading-5 text-white">{name}</p>
          <div className="mt-1 flex items-center justify-between gap-1">
            <p className="!my-0 text-[0.65rem] leading-4 text-sky-100">{note}</p>
            <p className="!my-0 shrink-0 text-xl font-semibold tabular-nums leading-none text-white">{count}</p>
          </div>
        </div>
        <div className="flex min-h-0 flex-1 flex-col justify-end overflow-hidden px-2 pb-2">
          <div className="flex flex-col-reverse gap-1">
            {bars.slice(-12).map((beat, index) => (
              <motion.span
                key={`${name}-${bars.length - bars.slice(-12).length + index}`}
                className={`h-3 w-full rounded-sm ${barClass(name === 'Browser' ? 'sign' : beat.tone)}`}
                initial={reducedMotion ? false : { opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: reducedMotion ? 0 : 0.2 }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function PresignedUrlActivity() {
  const reducedMotion = useReducedMotion()
  const rootRef = useRef<HTMLDivElement>(null)
  const onScreen = useRef(false)
  const [auto, setAuto] = useState(false)
  const [speed, setSpeed] = useState<(typeof SPEEDS)[number]>(1)
  const [landed, setLanded] = useState<Beat[]>([])
  const [forced, setForced] = useState<Actor | null>(null)
  const [flight, setFlight] = useState<{ beat: Beat; phase: Phase } | null>(null)
  const hopSeconds = (reducedMotion ? 0.01 : 0.42) / speed
  const upcoming = nextBeat(landed, forced)
  const browserHot = flight?.beat.actor === 'browser' || (!flight && (forced === 'browser' || upcoming.actor === 'browser'))
  const apiHot = flight?.beat.actor === 'api' || (!flight && (forced === 'api' || (forced === null && upcoming.actor === 'api')))
  const publicObject = flight?.beat.id === 'public' || (!flight && landed[landed.length - 1]?.id === 'public')
  const browserBars = landed.filter((beat) => beat.actor === 'browser')
  const apiBars = landed.filter((beat) => beat.actor === 'api')
  const s3Bars = landed.filter((beat) => beat.actor === 'browser')
  const last = landed[landed.length - 1]
  const step: ActivityStep = last
    ? { id: last.id, title: last.title, caption: last.caption, durationMs: 1 }
    : {
        id: 'empty',
        title: 'No requests yet',
        caption: 'The Browser button sends the request from the browser. The API button signs one URL. The bar stacks when the request lands.',
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
    if (flight || (!auto && !forced)) {
      return
    }

    const timer = window.setTimeout(() => {
      const beat = nextBeat(landed, forced)
      setForced(null)
      setFlight({ beat, phase: 'you' })
    }, forced ? 40 : 180 / speed)

    return () => window.clearTimeout(timer)
  }, [auto, flight, forced, landed, speed])

  useEffect(() => {
    if (!flight) {
      return
    }

    const hop = hopSeconds * 1000

    if (flight.phase === 'you') {
      const timer = window.setTimeout(() => setFlight({ ...flight, phase: 'hub' }), hop)

      return () => window.clearTimeout(timer)
    }

    if (flight.phase === 'hub') {
      const timer = window.setTimeout(() => {
        setFlight({ ...flight, phase: flight.beat.actor === 'api' ? 'api' : 'browser' })
      }, hop * 0.55)

      return () => window.clearTimeout(timer)
    }

    if (flight.phase === 'browser') {
      const timer = window.setTimeout(() => setFlight({ ...flight, phase: 's3' }), hop * 0.55)

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
        title="Who can fetch the object"
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
                <p className="!my-0 text-sm font-semibold text-slate-950">You</p>
              </div>

              <div className="relative h-10 w-px bg-slate-300">
                {flight?.phase === 'you' && !reducedMotion ? <Packet duration={hopSeconds} /> : null}
              </div>

              <div className={`flex w-48 flex-col items-center rounded-2xl px-4 py-4 text-center text-white ${flight && flight.phase !== 'you' ? 'bg-sky-600' : 'bg-slate-950'}`}>
                <p className="!my-0 text-xs text-sky-100">{(flight?.beat.actor ?? upcoming.actor) === 'api' ? 'API' : 'Browser'}</p>
                <p className="!my-0 mt-1 text-sm font-semibold leading-5">
                  {(flight?.beat.actor ?? upcoming.actor) === 'api' ? 'Signs one URL' : 'Sends the request'}
                </p>
              </div>

              <div className="h-4 w-px bg-slate-300" />

              <div className="relative grid w-full grid-cols-3 gap-3">
                <div className="pointer-events-none absolute top-0 right-[16.5%] left-[16.5%] h-px bg-slate-300" />
                <Column
                  name="API"
                  note="signature"
                  hot={flight?.phase === 'api'}
                  count={apiBars.length}
                  bars={apiBars}
                  packet={flight?.phase === 'api'}
                  hopSeconds={hopSeconds}
                  reducedMotion={reducedMotion === true}
                />
                <Column
                  name="Browser"
                  note="request"
                  hot={flight?.phase === 'browser'}
                  count={browserBars.length}
                  bars={browserBars}
                  packet={flight?.phase === 'browser'}
                  hopSeconds={hopSeconds * 0.55}
                  reducedMotion={reducedMotion === true}
                />
                <Column
                  name="S3"
                  note={publicObject ? 'public' : 'private'}
                  hot={flight?.phase === 's3'}
                  count={s3Bars.length}
                  bars={s3Bars}
                  packet={flight?.phase === 's3'}
                  hopSeconds={hopSeconds}
                  reducedMotion={reducedMotion === true}
                />
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-3">
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1" role="group" aria-label="Who sends the next request">
                  <button
                    type="button"
                    data-activity-actor="browser"
                    aria-pressed={browserHot}
                    onClick={() => setForced('browser')}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                      browserHot ? 'bg-slate-950 text-white' : 'border border-slate-200 text-slate-700'
                    }`}
                  >
                    Browser
                  </button>
                  <button
                    type="button"
                    data-activity-actor="api"
                    aria-pressed={apiHot}
                    onClick={() => setForced('api')}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                      apiHot ? 'bg-slate-950 text-white' : 'border border-slate-200 text-slate-700'
                    }`}
                  >
                    API
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
                  setForced(null)
                }}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                  <path d="M2.2 7a4.8 4.8 0 1 0 1.2-3.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                  <path d="M2 2.2v3h3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </IconButton>
            </div>
            <p className="!my-0 mt-2 text-xs text-slate-500">Rose on S3 is 403. Green on S3 is 200. Sky on the API is a signature.</p>
          </div>
        )}
      />
    </div>
  )
}
