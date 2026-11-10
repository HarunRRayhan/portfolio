'use client'

import { useState, type ReactNode } from 'react'
import BlogActivityFrame, { type ActivityStep } from '@/Components/BlogActivities/BlogActivityFrame'

type Scenario = 'break' | 'quiet' | 'drift'
type Period = { messages: number; failed: number; zero: number; unexplained: number } | null

const PERIODS = 12
const BREAK_AT = 5
const EMF_BREAK_AT = 8
// Validated with the dataviz palette checker in light and dark mode.
const COLORS = { success: '#0284c7', zero: '#d97706', unexplained: '#e11d48' }
const WINDOWS = [
  { m: 1, n: 1 },
  { m: 2, n: 3 },
  { m: 3, n: 3 },
] as const

const SCENARIOS: { id: Scenario; label: string; caption: string }[] = [
  { id: 'break', label: 'Writer breaks at 10:25', caption: 'About 100 messages every five minutes. At 10:25 a deploy ships a store client that saves nothing.' },
  { id: 'quiet', label: 'Quiet pipeline', caption: 'Same bug, same time, but only about five messages per period. Watch what the volume floor does.' },
  { id: 'drift', label: 'Prompt drift', caption: 'At 10:25 a prompt change makes the model answer nothing_to_extract for everything. Every empty has an excuse.' },
]

const label = (i: number) => `10:${String(i * 5).padStart(2, '0')}`

function series(scenario: Scenario, emfBroken: boolean): Period[] {
  const jitter = [4, -3, 1, -2, 0, 3, -4, 2, -1, 1, -2, 3]

  return jitter.map((j, i) => {
    if (emfBroken && i >= EMF_BREAK_AT) return null
    const messages = scenario === 'quiet' ? 5 + (j % 2) : 100 + j
    const broken = i >= BREAK_AT
    const explained = scenario === 'drift' && broken ? messages : Math.round(messages * 0.03)

    if (scenario === 'drift') return { messages, failed: 0, zero: explained, unexplained: 0 }

    return { messages, failed: 0, zero: broken ? messages : explained, unexplained: broken ? messages : 0 }
  })
}

// The alarm's metric math: IF(messages >= floor, 100 * unexplained / messages, 0).
function alarmValue(p: Period, floor: number): number | null {
  if (!p) return null

  return p.messages >= floor ? (100 * p.unexplained) / p.messages : 0
}

function states(values: (number | null)[], threshold: number, m: number, n: number): ('OK' | 'ALARM')[] {
  return values.map((_, i) => {
    // treat_missing_data = notBreaching: a missing point counts as a good one.
    const window = values.slice(Math.max(0, i - n + 1), i + 1)
    const breaching = window.filter((v) => v !== null && v >= threshold).length

    return breaching >= m ? 'ALARM' : 'OK'
  })
}

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

function Slider({ id, label: text, value, min, max, step, unit, onChange }: { id: string; label: string; value: number; min: number; max: number; step: number; unit: string; onChange: (v: number) => void }) {
  return (
    <label className="block text-xs text-slate-600 dark:text-slate-300">
      <span className="flex justify-between font-semibold">
        <span>{text}</span>
        <span className="font-mono text-slate-950 dark:text-white">{value}{unit}</span>
      </span>
      <input
        type="range"
        data-activity-slider={id}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1 w-full accent-sky-600"
      />
    </label>
  )
}

const W = 560
const H = 200
const PAD = { l: 34, r: 92, t: 10, b: 22 }
const x = (i: number) => PAD.l + (i * (W - PAD.l - PAD.r)) / (PERIODS - 1)
const y = (pct: number) => PAD.t + ((100 - pct) * (H - PAD.t - PAD.b)) / 100

function path(points: (number | null)[]): string {
  let d = ''
  points.forEach((v, i) => {
    if (v === null) return
    d += `${d && points[i - 1] !== null ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`
  })

  return d
}

export default function ZeroWriteAlarmActivity() {
  const [scenario, setScenario] = useState<Scenario>('break')
  const [threshold, setThreshold] = useState(20)
  const [floor, setFloor] = useState(20)
  const [windowIndex, setWindowIndex] = useState(1)
  const [emfBroken, setEmfBroken] = useState(false)
  const [hover, setHover] = useState<number | null>(null)

  const data = series(scenario, emfBroken)
  const pct = (pick: (p: NonNullable<Period>) => number) => data.map((p) => (p ? (100 * pick(p)) / p.messages : null))
  const success = pct((p) => p.messages - p.failed)
  const zero = pct((p) => p.zero)
  const unexplained = pct((p) => p.unexplained)
  const values = data.map((p) => alarmValue(p, floor))
  const { m, n } = WINDOWS[windowIndex]
  const alarm = states(values, threshold, m, n)
  const firstAlarm = alarm.indexOf('ALARM')
  const belowFloor = data.some((p) => p && p.messages < floor)

  const verdict = (): { tone: 'good' | 'bad' | 'warn'; text: string } => {
    if (firstAlarm >= 0) {
      const late = firstAlarm - BREAK_AT
      const tail = emfBroken && alarm[PERIODS - 1] === 'OK' ? ' Then the emitter breaks, missing data reads as OK, and the alarm clears itself while the writer is still broken. Alarm on EMFParsingErrors too.' : ''

      return { tone: tail ? 'warn' : 'good', text: `Pages at ${label(firstAlarm)}, ${late > 0 ? `${late * 5} minutes after` : 'in the same period'} the writer broke.${tail}` }
    }
    if (scenario === 'drift') return { tone: 'bad', text: 'Never pages. Unexplained stays at 0% because every empty has a reason. Only the amber all-zero line shows the drift, which is why the dashboard graphs it.' }
    if (scenario === 'quiet' && belowFloor) return { tone: 'bad', text: `Never pages. Every period is under the ${floor}-message floor, so the alarm math returns 0. For low traffic, alarm on the sum of UnexplainedZeroWrites instead.` }

    return { tone: 'bad', text: `Never pages. A ${threshold}% threshold is higher than anything this pipeline reports.` }
  }

  const result = verdict()
  const step: ActivityStep = { id: scenario, title: 'Tune the zero-write alarm', caption: SCENARIOS.find((s) => s.id === scenario)!.caption, durationMs: 1 }
  const h = hover !== null ? data[hover] : null

  return (
    <BlogActivityFrame
      title="Success rate vs zero-write rate, one hour of memory-extract"
      steps={[step]}
      playback={false}
      renderStage={() => (
        <div>
          <div className="flex flex-wrap gap-1" role="group" aria-label="Scenario">
            {SCENARIOS.map((s) => (
              <Pill key={s.id} pressed={scenario === s.id} onClick={() => setScenario(s.id)} data-activity-scenario={s.id}>{s.label}</Pill>
            ))}
          </div>

          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-slate-300" aria-hidden="true">
            <span className="flex items-center gap-1.5"><span className="h-0.5 w-4" style={{ background: COLORS.success }} />Success %</span>
            <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 border-t-2 border-dashed" style={{ borderColor: COLORS.zero }} />All zero-write %</span>
            <span className="flex items-center gap-1.5"><span className="h-1 w-4" style={{ background: COLORS.unexplained }} />Unexplained %</span>
          </div>

          {/* Phones scroll the chart sideways so the axis labels stay readable. */}
          <div className="-mx-1 overflow-x-auto px-1">
          <div className="min-w-[520px]">
          <div className="relative mt-2">
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Line chart of success rate, all zero-write rate and unexplained zero-write rate over twelve five-minute periods" onMouseLeave={() => setHover(null)}>
              {[0, 50, 100].map((g) => (
                <g key={g}>
                  <line x1={PAD.l} x2={W - PAD.r} y1={y(g)} y2={y(g)} className="stroke-slate-200 dark:stroke-slate-800" strokeWidth="1" />
                  <text x={PAD.l - 6} y={y(g) + 3} textAnchor="end" className="fill-slate-500 dark:fill-slate-400 text-[10px]">{g}%</text>
                </g>
              ))}
              <line x1={PAD.l} x2={W - PAD.r} y1={y(threshold)} y2={y(threshold)} className="stroke-slate-500 dark:stroke-slate-400" strokeWidth="1" strokeDasharray="2 3" />
              <text x={W - PAD.r + 4} y={y(threshold) + 3} className="fill-slate-600 dark:fill-slate-300 text-[10px]">threshold {threshold}%</text>
              {emfBroken ? (
                <rect x={x(EMF_BREAK_AT) - 6} y={PAD.t} width={x(PERIODS - 1) - x(EMF_BREAK_AT) + 12} height={H - PAD.t - PAD.b} className="fill-slate-100 dark:fill-slate-800/60" />
              ) : null}
              {hover !== null ? <line x1={x(hover)} x2={x(hover)} y1={PAD.t} y2={H - PAD.b} className="stroke-slate-400" strokeWidth="1" /> : null}
              <path d={path(success)} fill="none" stroke={COLORS.success} strokeWidth="2" strokeLinejoin="round" />
              <path d={path(zero)} fill="none" stroke={COLORS.zero} strokeWidth="2" strokeDasharray="5 4" strokeLinejoin="round" />
              <path d={path(unexplained)} fill="none" stroke={COLORS.unexplained} strokeWidth="2.5" strokeLinejoin="round" />
              {data.map((_, i) => (
                <g key={i}>
                  {i % 2 === 0 ? <text x={x(i)} y={H - 6} textAnchor="middle" className="fill-slate-500 dark:fill-slate-400 text-[10px]">{label(i)}</text> : null}
                  <rect x={x(i) - 20} y={PAD.t} width="40" height={H - PAD.t - PAD.b} fill="transparent" onMouseEnter={() => setHover(i)} onFocus={() => setHover(i)} />
                </g>
              ))}
              {emfBroken ? <text x={x(EMF_BREAK_AT)} y={PAD.t + 12} className="fill-slate-600 dark:fill-slate-300 text-[10px]">no EMF data</text> : null}
            </svg>
            {h && hover !== null ? (
              <div className="pointer-events-none absolute top-1 rounded-lg bg-slate-950 px-2 py-1.5 text-[0.7rem] leading-4 text-slate-100 shadow" style={{ left: `${Math.min((x(hover) / W) * 100, 62)}%` }}>
                <p className="!my-0 font-semibold">{label(hover)}</p>
                <p className="!my-0">Messages {h.messages}</p>
                <p className="!my-0">Success {success[hover]!.toFixed(0)}%</p>
                <p className="!my-0">All zero-write {zero[hover]!.toFixed(0)}%</p>
                <p className="!my-0">Unexplained {unexplained[hover]!.toFixed(0)}%</p>
                <p className="!my-0">Alarm math {values[hover]!.toFixed(0)}</p>
              </div>
            ) : null}
          </div>

          <ol aria-label="Alarm state per period" className="!my-0 mt-1 grid !list-none grid-cols-12 gap-0.5 !pl-0" style={{ marginLeft: `${(PAD.l / W) * 100 - 3}%`, marginRight: `${(PAD.r / W) * 100 - 3}%` }}>
            {alarm.map((s, i) => (
              <li
                key={i}
                data-activity-state={s}
                title={`${label(i)}: ${s}${data[i] ? '' : ' (missing data)'}`}
                className={`!my-0 rounded py-1 text-center text-[0.55rem] font-semibold ${
                  s === 'ALARM' ? 'bg-rose-600 text-white' : data[i] === null ? 'bg-slate-200 dark:bg-slate-800 text-slate-500' : 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-200'
                }`}
              >
                {s === 'ALARM' ? '🔔' : 'OK'}
                <span className="sr-only"> at {label(i)}</span>
              </li>
            ))}
          </ol>
          </div>
          </div>

          <p
            data-activity-result=""
            aria-live="polite"
            className={`!my-0 mt-3 rounded-xl px-3 py-2 text-sm font-semibold ${
              result.tone === 'bad'
                ? 'bg-rose-100 dark:bg-rose-950/50 text-rose-950 dark:text-rose-100'
                : result.tone === 'warn'
                  ? 'bg-amber-100 dark:bg-amber-950/50 text-amber-950 dark:text-amber-100'
                  : 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-950 dark:text-emerald-100'
            }`}
          >
            {result.text}
          </p>

          <div className="mt-4 grid gap-4 border-t border-slate-200 dark:border-slate-800 pt-3 sm:grid-cols-2">
            <Slider id="threshold" label="Threshold" value={threshold} min={5} max={100} step={5} unit="%" onChange={setThreshold} />
            <Slider id="floor" label="Volume floor (messages >=)" value={floor} min={0} max={50} step={5} unit="" onChange={setFloor} />
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-1" role="group" aria-label="Datapoints to alarm">
              <span className="mr-1 text-xs font-semibold text-slate-500 dark:text-slate-400">Datapoints</span>
              {WINDOWS.map((w, i) => (
                <Pill key={i} pressed={windowIndex === i} onClick={() => setWindowIndex(i)} data-activity-window={`${w.m}of${w.n}`}>{w.m} of {w.n}</Pill>
              ))}
            </div>
            <Pill pressed={emfBroken} onClick={() => setEmfBroken((v) => !v)} data-activity-emf="">Break the EMF emitter at {label(EMF_BREAK_AT)}</Pill>
          </div>
        </div>
      )}
    />
  )
}
