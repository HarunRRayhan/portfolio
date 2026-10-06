'use client'

import { motion, useReducedMotion } from 'framer-motion'
import BlogActivityFrame, { type ActivityStep } from '@/Components/BlogActivities/BlogActivityFrame'

const LANES = [
  { name: 'Python', finish: 58, note: 'Interpreter' },
  { name: 'PHP', finish: 64, note: 'Interpreter' },
  { name: 'JavaScript', finish: 76, note: 'JIT' },
  { name: 'Go', finish: 90, note: 'Compiled, GC' },
  { name: 'Rust', finish: 100, note: 'Compiled, no GC on this work' },
] as const

const STEPS: ActivityStep[] = [
  {
    id: 'workload',
    title: 'Same small workload',
    caption: 'Each lane counts, allocates, and hashes. This is a model of where the time goes, not a benchmark from a machine.',
    durationMs: 5000,
  },
  {
    id: 'interpreters',
    title: 'Python and PHP',
    caption: 'Both walk the program as they run it. The loop pays that cost on every iteration.',
    durationMs: 4200,
  },
  {
    id: 'javascript',
    title: 'JavaScript',
    caption: 'The JIT speeds up the hot loop after it has seen it. Startup and allocation still sit in the lane.',
    durationMs: 4200,
  },
  {
    id: 'go',
    title: 'Go',
    caption: 'Go compiles ahead of time. The garbage collector still has to scan the allocations this loop made.',
    durationMs: 4200,
  },
  {
    id: 'rust',
    title: 'Rust',
    caption: 'Rust compiles ahead of time and this workload does not pause for a garbage collector. The order of the lanes does not change when you speed the picture up.',
    durationMs: 4600,
  },
]

function Stage({ speed }: { speed: number }) {
  const reducedMotion = useReducedMotion()

  return (
      <div className="space-y-3">
        <p className="!my-0 text-xs font-medium text-slate-500">Model of where the time goes. Faster playback does not change who finishes first.</p>
        {LANES.map((lane) => (
          <div key={lane.name} className="grid grid-cols-[5.5rem_minmax(0,1fr)] items-center gap-x-2 gap-y-0.5">
            <p className="!my-0 text-xs font-semibold text-slate-800">{lane.name}</p>
            <div className="h-3 overflow-hidden rounded-full bg-slate-100">
              <motion.div
                className="h-full rounded-full bg-slate-900"
                initial={reducedMotion ? { width: `${lane.finish}%` } : { width: '6%' }}
                animate={{ width: `${lane.finish}%` }}
                transition={
                  reducedMotion
                    ? { duration: 0 }
                    : { duration: 5.5 / speed, ease: 'linear', repeat: Infinity, repeatType: 'loop', repeatDelay: 0.4 }
                }
              />
            </div>
            <p className="!my-0 col-start-2 text-[0.7rem] leading-4 text-slate-500">{lane.note}</p>
          </div>
        ))}
      </div>
  )
}

export default function LanguageRaceActivity() {
  return (
    <BlogActivityFrame
      title="Same work, five lanes"
      steps={STEPS}
      renderStage={(_stepIndex, speed) => <Stage speed={speed} />}
    />
  )
}
