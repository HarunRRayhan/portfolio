'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import BlogActivityFrame, { type ActivityStep } from '@/Components/BlogActivities/BlogActivityFrame'

const SERVERS = ['Server A', 'Server B', 'Server C'] as const

type Algorithm = {
  id: string
  title: string
  serverNotes: [string, string, string]
  legend: 'requests' | 'clients' | 'keys'
  phases: ActivityStep[]
}

const ALGORITHMS: Record<string, Algorithm> = {
  'round-robin': {
    id: 'round-robin',
    title: 'Round robin',
    serverNotes: ['', '', ''],
    legend: 'requests',
    phases: [
      {
        id: 'first',
        title: 'The first lap',
        caption: 'Request 1 goes to A, 2 to B, 3 to C.',
        durationMs: 2800,
      },
      {
        id: 'second',
        title: 'The same order again',
        caption: 'Request 4 is back on A. The balancer does not look at how busy anyone is.',
        durationMs: 2800,
      },
      {
        id: 'full',
        title: 'Eight requests',
        caption: 'A and B are one ahead of C, because eight does not divide by three.',
        durationMs: 3200,
      },
    ],
  },
  'weighted-round-robin': {
    id: 'weighted-round-robin',
    title: 'Weighted round robin',
    serverNotes: ['weight 5', 'weight 1', 'weight 1'],
    legend: 'requests',
    phases: [
      {
        id: 'heavy',
        title: 'The heavy server takes the first five',
        caption: 'A has weight 5. The first five requests all land there.',
        durationMs: 2800,
      },
      {
        id: 'light',
        title: 'Then the light servers get one each',
        caption: 'Request 6 goes to B. Request 7 goes to C.',
        durationMs: 2800,
      },
      {
        id: 'again',
        title: 'The next lap starts on A',
        caption: 'Request 8 is back on the weight-5 server. The ratio is 5 to 1 to 1.',
        durationMs: 3200,
      },
    ],
  },
  'least-connections': {
    id: 'least-connections',
    title: 'Least connections',
    serverNotes: ['', '', ''],
    legend: 'requests',
    phases: [
      {
        id: 'open',
        title: 'Open requests, not finished ones',
        caption: 'The next request goes to the server with the fewest still open. A long request keeps its server out of the running.',
        durationMs: 3000,
      },
      {
        id: 'spread',
        title: 'The quiet servers catch up',
        caption: 'B and C take work while A is still holding an earlier request.',
        durationMs: 3000,
      },
      {
        id: 'full',
        title: 'Eight requests, uneven holds',
        caption: 'An Application Load Balancer calls this least outstanding requests.',
        durationMs: 3400,
      },
    ],
  },
  'weighted-least-connections': {
    id: 'weighted-least-connections',
    title: 'Weighted least connections',
    serverNotes: ['weight 5', 'weight 1', 'weight 1'],
    legend: 'requests',
    phases: [
      {
        id: 'share',
        title: 'Busy is relative to size',
        caption: 'One open request on A (weight 5) is less busy than one open request on B (weight 1).',
        durationMs: 3000,
      },
      {
        id: 'fill',
        title: 'A keeps taking work',
        caption: 'A can hold several connections before it looks as loaded as B or C.',
        durationMs: 3000,
      },
      {
        id: 'full',
        title: 'Same weights, fairer than a fixed lap',
        caption: 'The ratio follows the weights, and a server that finishes early gets the next request.',
        durationMs: 3400,
      },
    ],
  },
  'least-response-time': {
    id: 'least-response-time',
    title: 'Least response time',
    serverNotes: ['40 ms', '12 ms', '18 ms'],
    legend: 'requests',
    phases: [
      {
        id: 'fast',
        title: 'The fast server wins the first request',
        caption: 'B answers in 12 ms. C answers in 18. A answers in 40. The first request goes to B.',
        durationMs: 3000,
      },
      {
        id: 'shift',
        title: 'A fast server with a queue can lose',
        caption: 'Once B has open requests, C becomes the quicker bet. A stays quiet.',
        durationMs: 3000,
      },
      {
        id: 'full',
        title: 'Time and connections together',
        caption: 'HAProxy calls this least response time. It is not the same as least connections.',
        durationMs: 3400,
      },
    ],
  },
  'ip-hash': {
    id: 'ip-hash',
    title: 'IP hash',
    serverNotes: ['', '', ''],
    legend: 'clients',
    phases: [
      {
        id: 'one-client',
        title: 'One client, one server',
        caption: 'Client A hashes to server A. Every request from that address follows.',
        durationMs: 2800,
      },
      {
        id: 'still',
        title: 'The hash does not rotate',
        caption: 'Six requests from client A are still on server A. Round robin would have spread them.',
        durationMs: 2800,
      },
      {
        id: 'second',
        title: 'A second address can land elsewhere',
        caption: 'Client B hashes to server C. A Network Load Balancer flow hash is the same idea, for the life of one connection.',
        durationMs: 3400,
      },
    ],
  },
  'consistent-hash': {
    id: 'consistent-hash',
    title: 'Consistent hashing',
    serverNotes: ['', '', ''],
    legend: 'keys',
    phases: [
      {
        id: 'keys',
        title: 'Each key picks a place on the ring',
        caption: 'Key A sticks to server A, key B to server C, key C to server B.',
        durationMs: 2800,
      },
      {
        id: 'repeat',
        title: 'The same key comes back',
        caption: 'A repeat of key A does not move. Adding requests does not reshuffle the ones you already placed.',
        durationMs: 3000,
      },
      {
        id: 'full',
        title: 'Eight requests, three keys',
        caption: 'Envoy calls a form of this ring hash. It is how a cache stays sticky when you add or remove a node.',
        durationMs: 3400,
      },
    ],
  },
  'power-of-two': {
    id: 'power-of-two',
    title: 'Power of two choices',
    serverNotes: ['', '', ''],
    legend: 'requests',
    phases: [
      {
        id: 'pair',
        title: 'Look at two servers, not all of them',
        caption: 'Each request picks two servers at random and goes to the less loaded one.',
        durationMs: 3000,
      },
      {
        id: 'dodge',
        title: 'The loaded server gets skipped',
        caption: 'You never scan the whole pool, and you still avoid the box that is already buried.',
        durationMs: 3000,
      },
      {
        id: 'full',
        title: 'Better than plain random',
        caption: 'Plain random takes the first pick and stops. Power of two takes the second look.',
        durationMs: 3400,
      },
    ],
  },
}

const PHASE_COUNTS = [3, 6, 8]
const SPEEDS = [0.5, 1, 2] as const
const VISIBLE_BARS = 9

function assign(algorithm: string, count: number): number[] {
  const placements: number[] = []

  if (algorithm === 'weighted-round-robin') {
    const pattern = [0, 0, 0, 0, 0, 1, 2]

    for (let index = 0; index < count; index += 1) {
      placements.push(pattern[index % pattern.length])
    }

    return placements
  }

  if (algorithm === 'least-connections') {
    const open = [0, 0, 0]
    const remaining: number[][] = [[], [], []]
    const holdFor = [4, 1, 1]
    let cursor = 0

    while (placements.length < count) {
      for (let server = 0; server < 3; server += 1) {
        remaining[server] = remaining[server].map((ticks) => ticks - 1).filter((ticks) => ticks > 0)
        open[server] = remaining[server].length
      }

      const least = Math.min(...open)
      let pick = cursor

      for (let step = 0; step < 3; step += 1) {
        const server = (cursor + step) % 3

        if (open[server] === least) {
          pick = server
          break
        }
      }

      cursor = (pick + 1) % 3
      placements.push(pick)
      remaining[pick].push(holdFor[pick])
      open[pick] = remaining[pick].length
    }

    return placements
  }

  if (algorithm === 'weighted-least-connections') {
    const weights = [5, 1, 1]
    const active = [0, 0, 0]

    for (let index = 0; index < count; index += 1) {
      let pick = 0

      for (let server = 1; server < 3; server += 1) {
        if (active[server] / weights[server] < active[pick] / weights[pick]) {
          pick = server
        }
      }

      placements.push(pick)
      active[pick] += 1
    }

    return placements
  }

  if (algorithm === 'least-response-time') {
    const latency = [40, 12, 18]
    const active = [0, 0, 0]

    for (let index = 0; index < count; index += 1) {
      let pick = 0

      for (let server = 1; server < 3; server += 1) {
        const candidate = (active[server] + 1) * latency[server]
        const current = (active[pick] + 1) * latency[pick]

        if (candidate < current) {
          pick = server
        }
      }

      placements.push(pick)
      active[pick] += 1
    }

    return placements
  }

  if (algorithm === 'ip-hash') {
    for (let index = 0; index < count; index += 1) {
      placements.push(index < Math.max(count - 2, 1) ? 0 : 2)
    }

    return placements
  }

  if (algorithm === 'consistent-hash') {
    const ring = [0, 2, 1]

    for (let index = 0; index < count; index += 1) {
      placements.push(ring[index % ring.length])
    }

    return placements
  }

  if (algorithm === 'power-of-two') {
    const loads = [0, 0, 0]

    for (let index = 0; index < count; index += 1) {
      const left = (index * 3 + 1) % 3
      const right = (index * 5 + 2) % 3
      const pick = loads[left] <= loads[right] ? left : right
      placements.push(pick)
      loads[pick] += 1
    }

    return placements
  }

  for (let index = 0; index < count; index += 1) {
    placements.push(index % 3)
  }

  return placements
}

function dotClass(algorithm: string, index: number, count: number): string {
  if (algorithm === 'ip-hash' && index >= Math.max(count - 2, 1)) {
    return 'bg-amber-500'
  }

  if (algorithm === 'consistent-hash') {
    return ['bg-sky-600', 'bg-amber-500', 'bg-emerald-500'][index % 3]
  }

  return 'bg-sky-600'
}

function IconButton({
  label,
  pressed,
  disabled,
  onClick,
  children,
  testId,
}: {
  label: string
  pressed?: boolean
  disabled?: boolean
  onClick: () => void
  children: ReactNode
  testId: string
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={pressed}
      disabled={disabled}
      data-activity-control={testId}
      onClick={onClick}
      className={`inline-flex h-10 w-10 items-center justify-center rounded-full border text-slate-900 disabled:cursor-not-allowed disabled:opacity-30 ${
        pressed ? 'border-slate-950 bg-slate-950 text-white' : 'border-slate-200 bg-white'
      }`}
    >
      {children}
    </button>
  )
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

function Stage({
  algorithm,
  count,
  placements,
  flight,
  hopSeconds,
  controls,
}: {
  algorithm: Algorithm
  count: number
  placements: number[]
  flight: { server: number; phase: 'user' | 'balancer' | 'service' } | null
  hopSeconds: number
  controls: ReactNode
}) {
  const reducedMotion = useReducedMotion()
  const totals = [0, 0, 0]

  placements.forEach((server) => {
    totals[server] += 1
  })

  const balancerHot = flight?.phase === 'balancer' || flight?.phase === 'service'

  return (
    <div>
      <div className="mx-auto flex w-full max-w-xl flex-col items-center">
        <div className={`flex items-center gap-2 rounded-full border px-3 py-1.5 ${flight?.phase === 'user' ? 'border-sky-500 bg-sky-50' : 'border-slate-200 bg-white'}`}>
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-950 text-white">
            <svg width="16" height="16" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <circle cx="9" cy="6" r="2.4" stroke="currentColor" strokeWidth="1.6" />
              <path d="M4.2 15.2c.7-2.4 2.5-3.6 4.8-3.6s4.1 1.2 4.8 3.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </span>
          <p className="!my-0 text-sm font-semibold text-slate-950">You</p>
        </div>

        <div className="relative h-10 w-px bg-slate-300">
          {flight?.phase === 'user' && !reducedMotion ? <Packet duration={hopSeconds} /> : null}
        </div>

        <div className={`flex w-48 flex-col items-center rounded-2xl px-4 py-4 text-center text-white ${balancerHot ? 'bg-sky-600' : 'bg-slate-950'}`}>
          <p className="!my-0 text-xs text-sky-100">Load balancer</p>
          <p className="!my-0 mt-1 text-sm font-semibold leading-5">{algorithm.title}</p>
        </div>

        <div className="h-4 w-px bg-slate-300" />

        <div className="relative grid w-full grid-cols-3 gap-3">
          <div className="pointer-events-none absolute top-0 right-[16.5%] left-[16.5%] h-px bg-slate-300" />
          {SERVERS.map((name, server) => {
            const owned = placements
              .map((target, index) => ({ target, index }))
              .filter((item) => item.target === server)
              .slice(-12)
            const dropping = flight?.phase === 'service' && flight.server === server

            return (
              <div key={name} className="flex flex-col items-center">
                <div className={`relative h-8 w-px ${dropping ? 'bg-sky-500' : 'bg-slate-300'}`}>
                  {dropping && !reducedMotion ? <Packet duration={hopSeconds} /> : null}
                </div>
                <div
                  aria-label={name.replace('Server ', 'Service ')}
                  className={`flex h-64 w-full flex-col overflow-hidden rounded-2xl md:h-72 ${dropping ? 'bg-sky-700' : 'bg-slate-950'}`}
                >
                  <div className="flex items-start justify-between gap-1 px-2.5 py-2">
                    <div>
                      <p className="!my-0 text-[0.65rem] text-sky-100">Service</p>
                      <p className="!my-0 text-base font-semibold leading-5 text-white">{name.replace('Server ', '')}</p>
                      {algorithm.serverNotes[server] ? (
                        <p className="!my-0 text-[0.65rem] text-sky-100">{algorithm.serverNotes[server]}</p>
                      ) : null}
                    </div>
                    <p className="!my-0 text-2xl font-semibold tabular-nums leading-none text-white">{totals[server]}</p>
                  </div>
                  <div className="flex min-h-0 flex-1 flex-col justify-end overflow-hidden px-2 pb-2">
                    <div className="flex flex-col-reverse gap-1">
                    {owned.map((item) => (
                      <motion.span
                        key={`${algorithm.id}-${item.index}`}
                        className={`h-3 w-full origin-left rounded-sm ${dotClass(algorithm.id, item.index, count)}`}
                        initial={reducedMotion || item.index !== count - 1 ? false : { opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: reducedMotion ? 0 : 0.2 }}
                      />
                    ))}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-3">
        {controls}
      </div>
      {algorithm.legend === 'clients' ? (
        <p className="!my-0 mt-2 text-xs text-slate-500">Sky is client A. Amber is client B.</p>
      ) : null}
      {algorithm.legend === 'keys' ? (
        <p className="!my-0 mt-2 text-xs text-slate-500">Sky is key A, amber is key B, green is key C.</p>
      ) : null}
    </div>
  )
}
function explanation(algorithm: Algorithm, count: number): ActivityStep {
  if (count >= PHASE_COUNTS[2]) {
    return algorithm.phases[2]
  }

  if (count >= PHASE_COUNTS[1]) {
    return algorithm.phases[1]
  }

  if (count >= PHASE_COUNTS[0]) {
    return algorithm.phases[0]
  }

  if (count === 0) {
    return {
      id: 'empty',
      title: 'No requests yet',
      caption: 'A request leaves you, reaches the load balancer, then stacks on one service.',
      durationMs: 1,
    }
  }

  return {
    id: 'landing',
    title: 'Requests are landing',
    caption: 'The next one takes a different service. The count on that service goes up when the request lands.',
    durationMs: 1,
  }
}

export default function LoadBalancerActivity({ algorithmId }: { algorithmId: string }) {
  const algorithm = ALGORITHMS[algorithmId]
  const reducedMotion = useReducedMotion()
  const rootRef = useRef<HTMLDivElement>(null)
  const onScreen = useRef(false)
  const [auto, setAuto] = useState(false)
  const [count, setCount] = useState(0)
  const [speed, setSpeed] = useState<(typeof SPEEDS)[number]>(1)
  const [flight, setFlight] = useState<{ server: number; phase: 'user' | 'balancer' | 'service' } | null>(null)
  const placements = useMemo(
    () => (algorithm ? assign(algorithm.id, count) : []),
    [algorithm, count],
  )
  const hopSeconds = (reducedMotion ? 0.01 : 0.42) / speed

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
    if (!auto || flight || !algorithm) {
      return
    }

    const timer = window.setTimeout(() => {
      const next = assign(algorithm.id, count + 1)
      setFlight({ server: next[next.length - 1] ?? 0, phase: 'user' })
    }, 180 / speed)

    return () => window.clearTimeout(timer)
  }, [algorithm, auto, count, flight, speed])

  useEffect(() => {
    if (!flight) {
      return
    }

    const hop = hopSeconds * 1000

    if (flight.phase === 'user') {
      const timer = window.setTimeout(() => setFlight({ ...flight, phase: 'balancer' }), hop)
      return () => window.clearTimeout(timer)
    }

    if (flight.phase === 'balancer') {
      const timer = window.setTimeout(() => setFlight({ ...flight, phase: 'service' }), hop * 0.55)
      return () => window.clearTimeout(timer)
    }

    const timer = window.setTimeout(() => {
      setCount((current) => current + 1)
      setFlight(null)
    }, hop)

    return () => window.clearTimeout(timer)
  }, [flight, hopSeconds])

  if (!algorithm) {
    return <p className="!my-0 text-sm text-slate-500">This figure is unavailable.</p>
  }

  const step = explanation(algorithm, count)

  return (
    <div ref={rootRef}>
      <BlogActivityFrame
        title={algorithm.title}
        steps={[step]}
        playback={false}
        renderStage={() => (
          <Stage
            algorithm={algorithm}
            count={count}
            placements={placements}
            flight={flight}
            hopSeconds={hopSeconds}
            controls={
              <>
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
                <IconButton
                  label="Reset"
                  disabled={count === 0}
                  onClick={() => {
                    setFlight(null)
                    setCount(0)
                  }}
                  testId="reset"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                    <path d="M2.2 7a4.8 4.8 0 1 0 1.2-3.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                    <path d="M2 2.2v3h3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </IconButton>
              </>
            }
          />
        )}
      />
    </div>
  )
}
