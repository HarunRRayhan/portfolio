'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { useCallback, useRef, useState } from 'react'
import BlogActivityFrame, { type ActivityStep } from '@/Components/BlogActivities/BlogActivityFrame'

const SERVERS = ['Server A', 'Server B', 'Server C'] as const

const STEPS: ActivityStep[] = [
  {
    id: 'round-robin',
    title: 'Round robin',
    caption: 'Each new request goes to the next server. A, then B, then C, then A again.',
    durationMs: 4200,
  },
  {
    id: 'weighted',
    title: 'Weighted round robin',
    caption: 'Server A has weight 5. B and C have weight 1. A takes five requests before the others see one.',
    durationMs: 4200,
  },
  {
    id: 'least-connections',
    title: 'Least connections',
    caption: 'The next request goes to the server with the fewest open requests. An Application Load Balancer calls this least outstanding requests.',
    durationMs: 4600,
  },
  {
    id: 'ip-hash',
    title: 'IP hash',
    caption: 'The same client keeps landing on the same server. A second client can land somewhere else. A Network Load Balancer flow hash is the same idea, per connection.',
    durationMs: 4600,
  },
  {
    id: 'power-of-two',
    title: 'Power of two choices',
    caption: 'Pick two servers at random and send the request to the less loaded one. Plain random skips that second look.',
    durationMs: 4600,
  },
]

function assign(algorithm: string, count: number): number[] {
  const placements: number[] = []

  if (algorithm === 'weighted') {
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

  if (algorithm === 'ip-hash') {
    for (let index = 0; index < count; index += 1) {
      placements.push(index < Math.max(count - 2, 1) ? 0 : 2)
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

function Stage({ algorithm, count, speed }: { algorithm: string; count: number; speed: number }) {
  const reducedMotion = useReducedMotion()
  const placements = assign(algorithm, count)
  const totals = [0, 0, 0]

  placements.forEach((server) => {
    totals[server] += 1
  })

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-xs font-medium text-slate-500">
        <span>{count} requests</span>
        {algorithm === 'ip-hash' ? (
          <span className="inline-flex items-center gap-3">
            <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-sky-500" /> Client A</span>
            <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-500" /> Client B</span>
          </span>
        ) : (
          <span>Each dot is one request</span>
        )}
      </div>
      <div className="grid grid-cols-3 gap-3">
        {SERVERS.map((name, server) => (
          <div key={name} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-center justify-between gap-2">
      <p className="!my-0 text-xs font-semibold text-slate-800">{name}</p>
              <p className="!my-0 text-xs tabular-nums text-slate-500">{totals[server]}</p>
            </div>
            <div className="mt-3 flex h-36 flex-col-reverse items-center gap-1 overflow-hidden rounded-lg bg-white px-2 py-2">
              {placements.map((target, index) =>
                target === server ? (
                  <motion.span
                    key={`${algorithm}-${count}-${index}`}
                    className={`h-3 w-12 shrink-0 rounded-full ${
                      algorithm === 'ip-hash' && index >= Math.max(count - 2, 1) ? 'bg-amber-500' : 'bg-sky-600'
                    }`}
                    initial={reducedMotion ? false : { opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.28 / speed, delay: reducedMotion ? 0 : (index % 8) * (0.05 / speed) }}
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

export default function LoadBalancerActivity() {
  const [extra, setExtra] = useState(0)
  const stepRef = useRef(0)
  const handleStep = useCallback((index: number) => {
    if (stepRef.current === index) {
      return
    }

    stepRef.current = index
    setExtra(0)
  }, [])

  return (
    <BlogActivityFrame
      title="Where the next request goes"
      steps={STEPS}
      onStepIndexChange={handleStep}
      detail={extra > 0 ? `${extra} extra ${extra === 1 ? 'request was' : 'requests were'} sent on this algorithm.` : undefined}
      renderStage={(stepIndex, speed) => (
        <Stage algorithm={STEPS[stepIndex].id} count={8 + extra} speed={speed} />
      )}
      footer={({ stepIndex, setStepIndex }) => (
        <>
          {STEPS.map((step, index) => (
            <button
              key={step.id}
              type="button"
              aria-pressed={stepIndex === index}
              onClick={() => {
                stepRef.current = index
                setExtra(0)
                setStepIndex(index)
              }}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                stepIndex === index ? 'bg-sky-600 text-white' : 'border border-slate-200 text-slate-700'
              }`}
            >
              {step.title}
            </button>
          ))}
          <button
            type="button"
            data-activity-branch="send-one-more"
            onClick={() => setExtra((current) => current + 1)}
            className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-800"
          >
            Send one more
          </button>
        </>
      )}
    />
  )
}
