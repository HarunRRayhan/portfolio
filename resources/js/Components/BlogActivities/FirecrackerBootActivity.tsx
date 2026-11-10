'use client'

import { useReducedMotion } from 'framer-motion'
import { useEffect, useState, type ReactNode } from 'react'
import BlogActivityFrame, { type ActivityStep } from '@/Components/BlogActivities/BlogActivityFrame'

type Path = 'cold' | 'restore' | 'pool'
type Phase = { label: string; ms: number; tone: string }

// Illustrative timings in the range public write-ups report; not a benchmark.
const NETWORK_FAULTS_MS = 90
const AXIS_MS = 1200
const SWEEP_MS = 3200
const BURST = 20

const COLORS = {
  vmm: 'bg-slate-400 dark:bg-slate-500',
  kernel: 'bg-sky-500',
  init: 'bg-violet-500',
  app: 'bg-amber-500',
  restore: 'bg-emerald-500',
  fixup: 'bg-teal-600',
  faults: 'bg-rose-500',
  pool: 'bg-emerald-600',
}

function phases(path: Path, networkMemory: boolean, reseed: boolean): Phase[] {
  const fixups = reseed ? [{ label: 'new SSH keys + machine-id, MMDS identity, step clock', ms: 10, tone: COLORS.fixup }] : []

  if (path === 'cold') {
    return [
      { label: 'spawn jailer + VMM', ms: 10, tone: COLORS.vmm },
      { label: 'boot kernel', ms: 125, tone: COLORS.kernel },
      { label: 'init + services', ms: 400, tone: COLORS.init },
      { label: 'app warm-up', ms: 600, tone: COLORS.app },
    ]
  }

  if (path === 'restore') {
    return [
      { label: 'spawn jailer + VMM', ms: 10, tone: COLORS.vmm },
      { label: 'map memory + load state', ms: 8, tone: COLORS.restore },
      ...fixups,
      ...(networkMemory ? [{ label: 'first-touch page faults over the network', ms: NETWORK_FAULTS_MS, tone: COLORS.faults }] : []),
    ]
  }

  return [
    { label: 'pop a paused box', ms: 1, tone: COLORS.pool },
    { label: 'resume', ms: 3, tone: COLORS.restore },
    ...fixups,
  ]
}

const total = (list: Phase[]) => list.reduce((n, p) => n + p.ms, 0)

const LANES: { id: Path; label: string; note: string }[] = [
  { id: 'cold', label: 'Cold boot', note: 'Kernel, init and your app start from zero on every request.' },
  { id: 'restore', label: 'Snapshot restore', note: 'Resume a VM that was booted and warmed once, then saved.' },
  { id: 'pool', label: 'Warm pool', note: 'Restored ahead of time and paused, waiting for a request.' },
]

function Pill({ pressed, onClick, children, ...data }: { pressed: boolean; onClick: () => void; children: ReactNode; [key: `data-${string}`]: string }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      {...data}
      className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
        pressed ? 'bg-slate-950 dark:bg-white text-white dark:text-slate-950' : 'border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200'
      }`}
    >
      {children}
    </button>
  )
}

function percentile(values: number[], p: number): number {
  const sorted = [...values].sort((a, b) => a - b)

  return sorted[Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1)]
}

export default function FirecrackerBootActivity() {
  const reducedMotion = useReducedMotion()
  const [mode, setMode] = useState<'race' | 'burst'>('race')
  const [networkMemory, setNetworkMemory] = useState(false)
  const [reseed, setReseed] = useState(true)
  const [poolSize, setPoolSize] = useState(5)
  // Sweep progress in axis-ms; -1 is idle.
  const [cursor, setCursor] = useState(-1)
  const running = cursor >= 0 && cursor < AXIS_MS
  const done = cursor >= AXIS_MS

  useEffect(() => {
    if (!running) return
    const started = performance.now() - (cursor / AXIS_MS) * SWEEP_MS
    let frame = 0
    const tick = (now: number) => {
      const next = Math.min(AXIS_MS, ((now - started) / SWEEP_MS) * AXIS_MS)
      setCursor(next)
      if (next < AXIS_MS) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)

    return () => cancelAnimationFrame(frame)
    // Only restart the loop when a run starts, not on every cursor update.
  }, [running])

  const reset = <T,>(set: (v: T) => void) => (v: T) => {
    setCursor(-1)
    set(v)
  }

  const start = () => setCursor(reducedMotion ? AXIS_MS : 0)
  const shown = Math.max(cursor, 0)

  const restoreMs = total(phases('restore', networkMemory, reseed))
  const poolMs = total(phases('pool', networkMemory, reseed))
  // Burst: the pool serves the first requests, the rest fall back to a restore; a refill takes one restore each.
  const burst = Array.from({ length: BURST }, (_, i) => (i < poolSize ? { path: 'pool' as const, ms: poolMs } : { path: 'restore' as const, ms: restoreMs }))
  const p50 = percentile(burst.map((b) => b.ms), 50)
  const p99 = percentile(burst.map((b) => b.ms), 99)

  const headline = (): string => {
    if (mode === 'race') {
      const cold = total(phases('cold', networkMemory, reseed))

      return `Cold boot ${cold} ms, restore ${restoreMs} ms, warm pool ${poolMs} ms. The restore is about ${Math.round(cold / restoreMs)}x faster, and the pool only costs memory you keep paused.`
    }
    if (poolSize === 0) return `No pool: all ${BURST} boxes restore from the snapshot. p50 and p99 are both ${restoreMs} ms.`
    if (poolSize >= BURST) return `The pool covers the whole burst at ${poolMs} ms each, but you are holding ${BURST} paused VMs in memory all day for it.`

    return `${poolSize} boxes come from the pool at ${poolMs} ms, the other ${BURST - poolSize} restore at ${restoreMs} ms. p50 ${p50} ms, p99 ${p99} ms. Refill runs in the background, one restore per box.`
  }

  const step: ActivityStep = {
    id: mode,
    title: mode === 'race' ? 'Race three ways to hand out a box' : `A burst of ${BURST} requests`,
    caption: 'Illustrative timings in the range public write-ups report, not a benchmark. Your kernel, rootfs and app decide the real numbers.',
    durationMs: 1,
  }

  return (
    <BlogActivityFrame
      title="How fast can you hand someone a fresh microVM?"
      steps={[step]}
      playback={false}
      renderStage={() => (
        <div>
          <div className="flex flex-wrap gap-1" role="group" aria-label="Mode">
            <Pill pressed={mode === 'race'} onClick={() => reset(setMode)('race')} data-activity-mode="race">One request, three ways</Pill>
            <Pill pressed={mode === 'burst'} onClick={() => reset(setMode)('burst')} data-activity-mode="burst">Burst of {BURST}</Pill>
          </div>

          {mode === 'race' ? (
            <div className="mt-4 space-y-3">
              {LANES.map((lane) => {
                const list = phases(lane.id, networkMemory, reseed)
                const end = total(list)
                const finished = shown >= end && cursor >= 0
                let offset = 0

                return (
                  <div key={lane.id} data-activity-lane={lane.id}>
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="!my-0 text-sm font-semibold text-slate-950 dark:text-white">{lane.label}</p>
                      <p className={`!my-0 font-mono text-sm font-semibold ${finished ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-400'}`}>
                        {cursor < 0 ? `${end} ms` : finished ? `ready in ${end} ms` : `${Math.round(shown)} ms…`}
                      </p>
                    </div>
                    <div className="relative mt-1 h-6 overflow-hidden rounded-md bg-slate-100 dark:bg-slate-800" role="img" aria-label={`${lane.label}: ${list.map((p) => `${p.label} ${p.ms} ms`).join(', ')}`}>
                      {list.map((p) => {
                        const left = (offset / AXIS_MS) * 100
                        const visible = Math.max(0, Math.min(p.ms, shown - offset))
                        offset += p.ms

                        return (
                          <span
                            key={p.label}
                            title={`${p.label}: ${p.ms} ms`}
                            className={`absolute inset-y-0 ${p.tone}`}
                            style={{ left: `${left}%`, width: `${Math.max((visible / AXIS_MS) * 100, visible > 0 ? 0.6 : 0)}%` }}
                          />
                        )
                      })}
                    </div>
                    <p className="!mb-0 !mt-1 text-[0.7rem] leading-4 text-slate-500 dark:text-slate-400">{lane.note}</p>
                  </div>
                )
              })}
              <div className="flex justify-between font-mono text-[0.65rem] leading-4 text-slate-400" aria-hidden="true">
                <span>0</span><span>300 ms</span><span>600 ms</span><span>900 ms</span><span>1.2 s</span>
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-1 text-[0.7rem] leading-4 text-slate-600 dark:text-slate-300" aria-hidden="true">
                {[['VMM', COLORS.vmm], ['kernel', COLORS.kernel], ['init', COLORS.init], ['app', COLORS.app], ['restore/resume', COLORS.restore], ['fix-ups', COLORS.fixup], ['page faults', COLORS.faults]].map(([l, c]) => (
                  <span key={l} className="flex items-center gap-1"><span className={`h-2 w-3 rounded-sm ${c}`} />{l}</span>
                ))}
              </div>
            </div>
          ) : (
            <div className="mt-4">
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
                <span className="flex justify-between"><span>Warm pool size</span><span className="font-mono text-slate-950 dark:text-white">{poolSize}</span></span>
                <input type="range" min={0} max={BURST} value={poolSize} data-activity-slider="pool" onChange={(e) => reset(setPoolSize)(Number(e.target.value))} className="mt-1 w-full accent-emerald-600" />
              </label>
              <ol aria-label="Boxes in the burst" className="!mb-0 !mt-3 grid !list-none grid-cols-5 gap-1.5 !pl-0 sm:grid-cols-10">
                {burst.map((b, i) => {
                  const ready = cursor >= 0 && shown >= (i / BURST) * AXIS_MS * 0.5 + b.ms

                  return (
                    <li
                      key={i}
                      data-activity-box={b.path}
                      className={`!my-0 flex h-12 flex-col items-center justify-center rounded-lg border text-[0.6rem] leading-3 ${
                        !ready
                          ? 'border-dashed border-slate-300 dark:border-slate-700 text-slate-400'
                          : b.path === 'pool'
                            ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-100'
                            : 'border-sky-300 dark:border-sky-800 bg-sky-50 dark:bg-sky-950/40 text-sky-900 dark:text-sky-100'
                      }`}
                    >
                      <span className="font-mono">box {i + 1}</span>
                      <span className="font-semibold">{ready ? (b.path === 'pool' ? 'pool' : 'restore') : 'queued'}</span>
                      <span className="font-mono">{ready ? `${b.ms} ms` : ''}</span>
                    </li>
                  )
                })}
              </ol>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                {[['p50', `${p50} ms`], ['p99', `${p99} ms`], ['paused VMs held', String(poolSize)]].map(([k, v]) => (
                  <div key={k} className="rounded-xl border border-slate-200 dark:border-slate-800 p-2">
                    <p className="!my-0 text-[0.65rem] leading-4 uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">{k}</p>
                    <p className="!my-0 font-mono text-base font-semibold text-slate-950 dark:text-white">{v}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {done ? (
            <p data-activity-result="" aria-live="polite" className="!mb-0 !mt-4 rounded-xl bg-emerald-100 dark:bg-emerald-950/50 px-3 py-2 text-sm font-semibold text-emerald-950 dark:text-emerald-100">
              {headline()}
            </p>
          ) : null}
          {!reseed ? (
            <p data-activity-warning="" className="!mb-0 !mt-2 rounded-xl bg-rose-100 dark:bg-rose-950/50 px-3 py-2 text-sm font-semibold text-rose-950 dark:text-rose-100">
              Fix-ups skipped: every box restored from this snapshot has the same SSH host keys, machine-id and userspace random state. Two customers can end up with the same &quot;random&quot; token.
            </p>
          ) : null}

          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-200 dark:border-slate-800 pt-3">
            <Pill pressed={networkMemory} onClick={() => reset(setNetworkMemory)(!networkMemory)} data-activity-toggle="network">Snapshot memory on network storage</Pill>
            <Pill pressed={!reseed} onClick={() => reset(setReseed)(!reseed)} data-activity-toggle="reseed">Skip post-restore fix-ups</Pill>
          </div>
          <div className="mt-3">
            <button
              type="button"
              data-activity-run=""
              disabled={running}
              onClick={start}
              className="rounded-full bg-sky-600 px-4 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {done ? 'Run again' : running ? 'Booting…' : mode === 'race' ? 'Request a box' : `Send ${BURST} requests`}
            </button>
          </div>
        </div>
      )}
    />
  )
}
