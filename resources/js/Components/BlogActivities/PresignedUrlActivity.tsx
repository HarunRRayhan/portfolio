'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import BlogActivityFrame, { type ActivityStep } from '@/Components/BlogActivities/BlogActivityFrame'
import { getImageUrl } from '@/lib/imageUtils'

type Actor = 'browser' | 'api'
type Phase = 'you' | 'hub' | 'browser' | 'api' | 's3'
type Tone = 'deny' | 'ok' | 'sign' | 'done'

type Beat = {
  id: string
  actor: Actor
  tone: Tone
  title: string
  caption: string
  part?: number
  packetLabel?: string
  barLabel?: string
}

const SPEEDS = [0.5, 1, 2] as const
const PART_COUNT = 4
const PART_SIZE = '512 MB'
const FILE_SIZE = '2 GB'

const LOGOS = {
  browser: getImageUrl('/images/logos/tech/google-chrome-logo.svg'),
  api: getImageUrl('/images/logos/tech/api-signing-key.svg'),
  s3: getImageUrl('/images/logos/tech/Amazon-S3-Logo.svg'),
} as const

function partBeat(part: number): Beat {
  return {
    id: `part-${part}`,
    actor: 'browser',
    tone: 'ok',
    part,
    packetLabel: `Part ${part}/${PART_COUNT}`,
    barLabel: `P${part}`,
    title: `The browser uploads part ${part} of ${PART_COUNT}`,
    caption: `The browser PUTs part ${part} (~${PART_SIZE}) of the ${FILE_SIZE} video to its own pre-signed URL. S3 stores that part. The API is not in the middle.`,
  }
}

const INITIATE: Beat = {
  id: 'initiate',
  actor: 'api',
  tone: 'sign',
  title: 'The API starts multipart and signs the parts',
  caption: `You ask the API to upload a ${FILE_SIZE} video. The API keeps the IAM key, calls CreateMultipartUpload, then signs ${PART_COUNT} part URLs. The Chrome client never sees the secret. The video bytes do not move yet.`,
}

const COMPLETE: Beat = {
  id: 'complete',
  actor: 'api',
  tone: 'done',
  packetLabel: FILE_SIZE,
  barLabel: FILE_SIZE,
  title: 'The API completes the multipart upload',
  caption: `All ${PART_COUNT} parts are on S3. The API sends CompleteMultipartUpload with the part ETags. S3 assembles the ${FILE_SIZE} video object.`,
}

const BROWSER_DENIED: Beat = {
  id: 'direct',
  actor: 'browser',
  tone: 'deny',
  title: 'The upload has no multipart session',
  caption: 'Browser is selected, and no multipart upload has been started yet. S3 answers 403. Choose API to create the upload and sign the parts, then come back.',
}

const BROWSER_WAIT_COMPLETE: Beat = {
  id: 'wait-complete',
  actor: 'browser',
  tone: 'deny',
  title: 'Parts are up. Complete is next',
  caption: `All ${PART_COUNT} parts of the ${FILE_SIZE} video are on S3. Choose API to call CompleteMultipartUpload and assemble the object.`,
}

type Session = {
  open: boolean
  parts: number
}

function sessionState(landed: Beat[]): Session {
  let open = false
  let parts = 0

  for (const beat of landed) {
    if (beat.id === 'initiate') {
      open = true
      parts = 0
    } else if (beat.id.startsWith('part-') && open) {
      parts += 1
    } else if (beat.id === 'complete') {
      open = false
      parts = 0
    }
  }

  return { open, parts }
}

function nextBeat(landed: Beat[], choice: 'cycle' | Actor): Beat {
  const session = sessionState(landed)

  if (choice === 'api') {
    if (session.open && session.parts >= PART_COUNT) {
      return COMPLETE
    }

    return INITIATE
  }

  if (choice === 'browser') {
    if (!session.open) {
      return BROWSER_DENIED
    }

    if (session.parts >= PART_COUNT) {
      return BROWSER_WAIT_COMPLETE
    }

    return partBeat(session.parts + 1)
  }

  if (!session.open) {
    return INITIATE
  }

  if (session.parts < PART_COUNT) {
    return partBeat(session.parts + 1)
  }

  return COMPLETE
}

function hubLabel(beat: Beat): { eyebrow: string; title: string } {
  if (beat.id === 'initiate') {
    return { eyebrow: 'CreateMultipart', title: 'Sign part URLs' }
  }

  if (beat.id === 'complete') {
    return { eyebrow: 'CompleteMultipart', title: `Assemble ${FILE_SIZE}` }
  }

  if (beat.part) {
    return { eyebrow: 'UploadPart', title: `Part ${beat.part} of ${PART_COUNT}` }
  }

  if (beat.tone === 'deny') {
    return { eyebrow: 'PUT', title: 'No signature' }
  }

  return { eyebrow: 'PUT', title: 'Upload' }
}

function Packet({ duration, label }: { duration: number; label?: string }) {
  if (label) {
    return (
      <motion.span
        className="absolute left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md bg-emerald-500 px-1.5 py-0.5 text-[0.55rem] font-semibold leading-4 text-white shadow-sm"
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

function LogoBadge({
  src,
  alt,
  fallback,
}: {
  src?: string
  alt: string
  fallback: ReactNode
}) {
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

function barClass(tone: Tone): string {
  if (tone === 'deny') {
    return 'bg-rose-500'
  }

  if (tone === 'ok') {
    return 'bg-emerald-500'
  }

  if (tone === 'done') {
    return 'bg-emerald-600'
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
  packetLabel,
  hopSeconds,
  reducedMotion,
  logoSrc,
  logoFallback,
}: {
  name: string
  note: string
  hot: boolean
  count: number
  bars: Beat[]
  packet: boolean
  packetLabel?: string
  hopSeconds: number
  reducedMotion: boolean
  logoSrc?: string
  logoFallback: ReactNode
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
            <LogoBadge src={logoSrc} alt={`${name} logo`} fallback={logoFallback} />
            <div className="min-w-0">
              <p className="!my-0 truncate text-sm font-semibold leading-5 text-white">{name}</p>
              <p className="!my-0 text-[0.65rem] leading-4 text-sky-100">{note}</p>
            </div>
            <p className="!my-0 ml-auto shrink-0 text-xl font-semibold tabular-nums leading-none text-white">{count}</p>
          </div>
        </div>
        <div className="flex min-h-0 flex-1 flex-col justify-end overflow-hidden px-2 pb-2">
          <div className="flex flex-col-reverse gap-1">
            {bars.slice(-12).map((beat, index) => {
              const tall = name === 'S3' && (beat.tone === 'ok' || beat.tone === 'done')
              const label = name === 'S3' ? beat.barLabel : null

              return (
                <motion.span
                  key={`${name}-${bars.length - bars.slice(-12).length + index}`}
                  className={`${tall ? 'flex h-7 items-center justify-center text-[0.55rem] font-semibold text-white' : 'h-3'} w-full rounded-sm ${barClass(name === 'Browser' || name === 'API' ? (beat.tone === 'deny' ? 'deny' : 'sign') : beat.tone)}`}
                  initial={reducedMotion ? false : { opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: reducedMotion ? 0 : 0.2 }}
                >
                  {label}
                </motion.span>
              )
            })}
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
  const [choice, setChoice] = useState<'cycle' | Actor>('cycle')
  const [flight, setFlight] = useState<{ beat: Beat; phase: Phase } | null>(null)
  const hopSeconds = (reducedMotion ? 0.01 : 0.42) / speed
  const upcoming = nextBeat(landed, choice)
  const activeBeat = flight?.beat ?? upcoming
  const activeActor = activeBeat.actor
  const hub = hubLabel(activeBeat)
  const browserSelected = choice === 'browser'
  const apiSelected = choice === 'api'
  const browserBars = landed.filter((beat) => beat.actor === 'browser')
  const apiBars = landed.filter((beat) => beat.actor === 'api')
  const s3Bars = landed.filter((beat) => beat.tone === 'ok' || beat.tone === 'done' || beat.id === 'direct')
  const last = landed[landed.length - 1]
  const step: ActivityStep = last
    ? { id: last.id, title: last.title, caption: last.caption, durationMs: 1 }
    : {
        id: 'empty',
        title: 'No requests yet',
        caption: `Pick Browser or API to stay on that side. Leave them and the cycle starts a multipart upload, ships ${PART_COUNT} parts of a ${FILE_SIZE} video, then completes it.`,
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
      if (flight.beat.id === 'wait-complete') {
        const timer = window.setTimeout(() => {
          setLanded((current) => [...current, flight.beat])
          setFlight(null)
        }, hop)

        return () => window.clearTimeout(timer)
      }

      const timer = window.setTimeout(() => setFlight({ ...flight, phase: 's3' }), hop * 0.55)

      return () => window.clearTimeout(timer)
    }

    if (flight.phase === 'api' && flight.beat.id === 'complete') {
      const timer = window.setTimeout(() => setFlight({ ...flight, phase: 's3' }), hop * 0.55)

      return () => window.clearTimeout(timer)
    }

    const timer = window.setTimeout(() => {
      setLanded((current) => [...current, flight.beat])
      setFlight(null)
    }, hop)

    return () => window.clearTimeout(timer)
  }, [flight, hopSeconds])

  const filePacket = Boolean(flight?.beat.packetLabel) || flight?.beat.actor === 'browser'

  return (
    <div ref={rootRef}>
      <BlogActivityFrame
        title={`Uploading a ${FILE_SIZE} video in parts`}
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
                  <p className="!my-0 text-[0.65rem] leading-4 text-slate-500">video.mp4 · {FILE_SIZE}</p>
                </div>
              </div>

              <div className="relative h-10 w-px bg-slate-300">
                {flight?.phase === 'you' && !reducedMotion ? (
                  <Packet
                    duration={hopSeconds}
                    label={flight.beat.packetLabel ?? (flight.beat.actor === 'browser' ? PART_SIZE : undefined)}
                  />
                ) : null}
              </div>

              <div className={`flex w-52 flex-col items-center rounded-2xl px-4 py-4 text-center text-white ${flight && flight.phase !== 'you' ? 'bg-sky-600' : 'bg-slate-950'}`}>
                <p className="!my-0 text-xs text-sky-100">{hub.eyebrow}</p>
                <p className="!my-0 mt-1 text-sm font-semibold leading-5">{hub.title}</p>
              </div>

              <div className="h-4 w-px bg-slate-300" />

              <div className="relative grid w-full grid-cols-3 gap-3">
                <div className="pointer-events-none absolute top-0 right-[16.5%] left-[16.5%] h-px bg-slate-300" />
                <Column
                  name="API"
                  note="signs"
                  hot={flight?.phase === 'api'}
                  count={apiBars.length}
                  bars={apiBars}
                  packet={flight?.phase === 'api'}
                  hopSeconds={hopSeconds}
                  reducedMotion={reducedMotion === true}
                  logoSrc={LOGOS.api}
                  logoFallback={<span className="text-[0.65rem] font-bold">key</span>}
                />
                <Column
                  name="Browser"
                  note="Chrome"
                  hot={flight?.phase === 'browser'}
                  count={browserBars.filter((beat) => beat.tone === 'ok').length}
                  bars={browserBars}
                  packet={flight?.phase === 'browser'}
                  packetLabel={filePacket ? flight?.beat.packetLabel ?? PART_SIZE : undefined}
                  hopSeconds={hopSeconds * 0.55}
                  reducedMotion={reducedMotion === true}
                  logoSrc={LOGOS.browser}
                  logoFallback={<span className="text-[0.55rem] font-bold">Chrome</span>}
                />
                <Column
                  name="S3"
                  note="private"
                  hot={flight?.phase === 's3'}
                  count={s3Bars.filter((beat) => beat.tone === 'ok' || beat.tone === 'done').length}
                  bars={s3Bars}
                  packet={flight?.phase === 's3'}
                  packetLabel={flight?.beat.packetLabel ?? (flight?.beat.tone === 'ok' ? PART_SIZE : undefined)}
                  hopSeconds={hopSeconds}
                  reducedMotion={reducedMotion === true}
                  logoSrc={LOGOS.s3}
                  logoFallback={<span className="text-[0.55rem] font-bold">S3</span>}
                />
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-3">
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1" role="group" aria-label="Browser uploads or API signs">
                  <button
                    type="button"
                    data-activity-actor="browser"
                    aria-pressed={browserSelected}
                    onClick={() => setChoice((current) => (current === 'browser' ? 'cycle' : 'browser'))}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${
                      browserSelected
                        ? 'bg-slate-950 text-white'
                        : choice === 'cycle' && activeActor === 'browser'
                          ? 'border border-sky-500 bg-sky-50 text-sky-950'
                          : 'border border-slate-200 text-slate-700'
                    }`}
                  >
                    <img src={LOGOS.browser} alt="" className="h-3.5 w-3.5 object-contain" />
                    Browser
                  </button>
                  <button
                    type="button"
                    data-activity-actor="api"
                    aria-pressed={apiSelected}
                    onClick={() => setChoice((current) => (current === 'api' ? 'cycle' : 'api'))}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${
                      apiSelected
                        ? 'bg-slate-950 text-white'
                        : choice === 'cycle' && activeActor === 'api'
                          ? 'border border-sky-500 bg-sky-50 text-sky-950'
                          : 'border border-slate-200 text-slate-700'
                    }`}
                  >
                    <img src={LOGOS.api} alt="" className="h-3.5 w-3.5 rounded-sm object-contain" />
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
              {choice === 'api'
                ? 'API stays selected. It starts multipart or completes the 2 GB object once every part is up.'
                : choice === 'browser'
                  ? 'Browser stays selected. Each request uploads the next 512 MB part of the video.'
                  : 'Full cycle: API signs the parts, the browser uploads Part 1–4, then API completes the 2 GB video. Pick Browser or API to stay there.'}
            </p>
          </div>
        )}
      />
    </div>
  )
}
