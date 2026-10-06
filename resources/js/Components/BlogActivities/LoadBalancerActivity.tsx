'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { useCallback, useRef, useState } from 'react'
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
    const active = [0, 0, 0]

    for (let index = 0; index < count; index += 1) {
      let pick = 0

      if (active[1] < active[pick]) {
        pick = 1
      }

      if (active[2] < active[pick]) {
        pick = 2
      }

      placements.push(pick)
      active[pick] += [3, 1, 2][index % 3]

      for (let server = 0; server < active.length; server += 1) {
        active[server] = Math.max(0, active[server] - 1)
      }
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

function Stage({ algorithm, count, speed }: { algorithm: Algorithm; count: number; speed: number }) {
  const reducedMotion = useReducedMotion()
  const placements = assign(algorithm.id, count)
  const totals = [0, 0, 0]

  placements.forEach((server) => {
    totals[server] += 1
  })

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-xs font-medium text-slate-500">
        <span>{count} {count === 1 ? 'request' : 'requests'}</span>
        {algorithm.legend === 'clients' ? (
          <span className="inline-flex items-center gap-3">
            <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-sky-600" /> Client A</span>
            <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-500" /> Client B</span>
          </span>
        ) : null}
        {algorithm.legend === 'keys' ? (
          <span className="inline-flex items-center gap-3">
            <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-sky-600" /> Key A</span>
            <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-500" /> Key B</span>
            <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Key C</span>
          </span>
        ) : null}
        {algorithm.legend === 'requests' ? <span>Each bar is one request</span> : null}
      </div>
      <div className="grid grid-cols-3 gap-3">
        {SERVERS.map((name, server) => (
          <div key={name} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="!my-0 text-xs font-semibold text-slate-800">{name}</p>
              <p className="!my-0 text-xs tabular-nums text-slate-500">{totals[server]}</p>
            </div>
            {algorithm.serverNotes[server] ? (
              <p className="!my-0 mt-1 text-[0.7rem] text-slate-500">{algorithm.serverNotes[server]}</p>
            ) : null}
            <div className="mt-3 flex h-36 flex-col-reverse items-center gap-1 overflow-hidden rounded-lg bg-white px-2 py-2">
              {placements.map((target, index) =>
                target === server ? (
                  <motion.span
                    key={`${algorithm.id}-${count}-${index}`}
                    className={`h-3 w-12 shrink-0 rounded-full ${dotClass(algorithm.id, index, count)}`}
                    initial={reducedMotion ? false : { opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.28 / speed, delay: reducedMotion ? 0 : index * (0.04 / speed) }}
                  />
                ) : null,
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function LoadBalancerActivity({ algorithmId }: { algorithmId: string }) {
  const algorithm = ALGORITHMS[algorithmId]
  const [extra, setExtra] = useState(0)
  const stepRef = useRef(0)
  const handleStep = useCallback((index: number) => {
    if (stepRef.current === index) {
      return
    }

    stepRef.current = index
    setExtra(0)
  }, [])

  if (!algorithm) {
    return <p className="!my-0 text-sm text-slate-500">This figure is unavailable.</p>
  }

  return (
    <BlogActivityFrame
      title={algorithm.title}
      steps={algorithm.phases}
      onStepIndexChange={handleStep}
      detail={extra > 0 ? `${extra} extra ${extra === 1 ? 'request was' : 'requests were'} sent on top of this step.` : undefined}
      renderStage={(stepIndex, speed) => (
        <Stage algorithm={algorithm} count={PHASE_COUNTS[stepIndex] + extra} speed={speed} />
      )}
      footer={() => (
        <button
          type="button"
          data-activity-branch="send-one-more"
          onClick={() => setExtra((current) => current + 1)}
          className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-800"
        >
          Send one more
        </button>
      )}
    />
  )
}
