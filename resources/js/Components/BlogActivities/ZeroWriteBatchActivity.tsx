'use client'

import { useReducedMotion } from 'framer-motion'
import { useEffect, useState, type ReactNode } from 'react'
import BlogActivityFrame, { type ActivityStep } from '@/Components/BlogActivities/BlogActivityFrame'

type Bug = 'healthy' | 'noop' | 'channel' | 'toolsoff' | 'duplicate' | 'drift'
type Policy = 'WARN' | 'FAIL'
type Verdict = 'OK' | 'WARN' | 'FAIL'

type Result = {
  ok: boolean
  itemsWritten: number
  errors: string[]
  emptyReason?: 'duplicate' | 'nothing_to_extract'
}

const BATCH = 10
const SPEEDS = [0.5, 1, 2] as const
const TICK_MS = 380

const BUGS: { id: Bug; label: string; story: string }[] = [
  { id: 'healthy', label: 'Healthy', story: 'The model calls the tool, the store saves the rows. One transcript really has nothing worth remembering.' },
  { id: 'noop', label: 'No-op writer', story: 'The model returns memories. The store accepts the call and saves nothing. No exception anywhere.' },
  { id: 'channel', label: 'Tool JSON in a text block', story: 'The model writes the tool call as text. A parser that only reads toolUse blocks sees no memories.' },
  { id: 'toolsoff', label: 'Tools-off flag', story: 'The model says "let me search first". A reused flag runs the retry with tools off, so the empty result is guaranteed.' },
  { id: 'duplicate', label: 'Redelivered batch', story: 'SQS is at-least-once. This batch already landed on the first delivery, so every write is a duplicate.' },
  { id: 'drift', label: 'Prompt drift', story: 'A prompt change makes the model answer nothing_to_extract for every transcript. Every empty has an excuse.' },
]

// One message's fate, with and without the contract from the post.
function outcome(bug: Bug, index: number, contract: boolean): Result {
  const memories = 1 + (index % 3)

  switch (bug) {
    case 'healthy':
      return index === 6
        ? { ok: true, itemsWritten: 0, errors: [], emptyReason: 'nothing_to_extract' }
        : { ok: true, itemsWritten: memories, errors: [] }
    case 'noop':
      return { ok: true, itemsWritten: 0, errors: [] }
    case 'channel':
      // The contract's reader spends its one wrong_channel retry, then gives up loudly.
      return contract ? { ok: false, itemsWritten: 0, errors: ['wrong_channel', 'wrong_channel'] } : { ok: true, itemsWritten: 0, errors: [] }
    case 'toolsoff':
      // callModel has no tools-off switch in the contract version, so the hinted retry works.
      return contract ? { ok: true, itemsWritten: memories, errors: ['prose'] } : { ok: true, itemsWritten: 0, errors: [] }
    case 'duplicate':
      return { ok: true, itemsWritten: 0, errors: [], emptyReason: 'duplicate' }
    case 'drift':
      return { ok: true, itemsWritten: 0, errors: [], emptyReason: 'nothing_to_extract' }
  }
}

function hrr_verdict(result: Result, policy: Policy): Verdict {
  if (!result.ok) return 'FAIL'
  if (result.itemsWritten > 0) return 'OK'
  if (result.emptyReason && result.errors.length === 0) return 'OK'
  return policy
}

function Pill({ pressed, onClick, children, disabled, ...data }: { pressed: boolean; onClick: () => void; children: ReactNode; disabled?: boolean; [key: `data-${string}`]: string }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      disabled={disabled}
      onClick={onClick}
      {...data}
      className={`rounded-full px-3 py-1.5 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-40 ${
        pressed ? 'bg-slate-950 dark:bg-white text-white dark:text-slate-950' : 'border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200'
      }`}
    >
      {children}
    </button>
  )
}

function Stat({ label, value, tone = 'plain' }: { label: string; value: ReactNode; tone?: 'plain' | 'good' | 'bad' | 'warn' }) {
  const color = { plain: 'text-slate-950 dark:text-white', good: 'text-emerald-700 dark:text-emerald-300', bad: 'text-rose-700 dark:text-rose-300', warn: 'text-amber-700 dark:text-amber-300' }[tone]

  return (
    <div className="flex items-baseline justify-between gap-2 border-b border-slate-100 dark:border-slate-800 py-1 last:border-0">
      <span className="text-xs text-slate-600 dark:text-slate-300">{label}</span>
      <span className={`font-mono text-sm font-semibold ${color}`}>{value}</span>
    </div>
  )
}

function Tile({ index, result, verdict, contract, processed }: { index: number; result: Result; verdict: Verdict; contract: boolean; processed: boolean }) {
  if (!processed) {
    return (
      <li className="!my-0 flex h-16 flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 dark:border-slate-700 text-[0.65rem] text-slate-400">
        <span className="font-mono">msg {index + 1}</span>
        <span>queued</span>
      </li>
    )
  }

  // Without the contract the handler only knows "it didn't throw", so every tile looks done.
  const look = !contract
    ? result.itemsWritten > 0
      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100'
      : 'bg-emerald-50 dark:bg-emerald-950/40 border-rose-400 dark:border-rose-700 border-dashed text-emerald-900 dark:text-emerald-100'
    : verdict === 'FAIL'
      ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-100'
      : verdict === 'WARN'
        ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-100'
        : result.itemsWritten > 0
          ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100'
          : 'bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200'

  const label = !contract ? 'done' : verdict === 'OK' ? (result.itemsWritten > 0 ? 'OK' : result.emptyReason) : verdict

  return (
    <li data-activity-tile={verdict} className={`!my-0 flex h-16 flex-col items-center justify-center rounded-lg border px-1 text-center text-[0.65rem] leading-4 ${look}`}>
      <span className="font-mono">msg {index + 1}</span>
      <span className="font-semibold">{label}</span>
      <span className="font-mono">wrote {result.itemsWritten}</span>
    </li>
  )
}

export default function ZeroWriteBatchActivity() {
  const reducedMotion = useReducedMotion()
  const [bug, setBug] = useState<Bug>('noop')
  const [contract, setContract] = useState(false)
  const [policy, setPolicy] = useState<Policy>('FAIL')
  const [reportFailures, setReportFailures] = useState(true)
  const [speed, setSpeed] = useState<(typeof SPEEDS)[number]>(1)
  // How many messages the handler has finished; -1 means not started.
  const [processed, setProcessed] = useState(-1)
  const running = processed >= 0 && processed < BATCH
  const done = processed >= BATCH

  useEffect(() => {
    if (!running) return
    const timer = window.setTimeout(() => setProcessed((n) => n + 1), TICK_MS / speed)

    return () => window.clearTimeout(timer)
  }, [processed, running, speed])

  const reset = <T,>(set: (value: T) => void) => (value: T) => {
    setProcessed(-1)
    set(value)
  }

  const results = Array.from({ length: BATCH }, (_, i) => outcome(bug, i, contract))
  const verdicts = results.map((r) => (contract ? hrr_verdict(r, policy) : 'OK'))
  const seen = Math.max(processed, 0)
  const sum = (pick: (r: Result, v: Verdict) => number) => results.slice(0, seen).reduce((n, r, i) => n + pick(r, verdicts[i]), 0)

  const written = sum((r) => r.itemsWritten)
  const zero = sum((r) => (r.ok && r.itemsWritten === 0 ? 1 : 0))
  const unexplained = sum((r, v) => (r.ok && v !== 'OK' ? 1 : 0))
  const failed = sum((_, v) => (v === 'FAIL' ? 1 : 0))
  const itemErrors = sum((r) => r.errors.length)
  const failureIds = verdicts.slice(0, seen).flatMap((v, i) => (v === 'FAIL' ? [`m${i + 1}`] : []))
  // Without ReportBatchItemFailures, Lambda ignores the list and the batch counts as a full success.
  const returned = reportFailures ? failureIds.length : 0
  const expectedRows = results.reduce((n, _, i) => n + (bug === 'duplicate' || (bug === 'healthy' && i === 6) ? 0 : 1 + (i % 3)), 0)
  const lost = written < expectedRows && returned === 0

  const story = BUGS.find((b) => b.id === bug)!.story

  const headline = (): { tone: 'bad' | 'warn' | 'good'; text: string } => {
    if (bug === 'healthy') return { tone: 'good', text: `${written} rows landed. The one empty transcript said why, so nothing pages.` }
    if (bug === 'drift') return contract
      ? { tone: 'warn', text: 'Every message has an excuse, so the verdicts are all OK and UnexplainedZeroWrites stays 0. Only the ZeroWrites total gives it away. That is why the dashboard graphs both.' }
      : { tone: 'warn', text: 'Ten empties, ten excuses nobody read. The store is empty and every light is green.' }
    if (bug === 'duplicate') return { tone: 'good', text: contract ? 'Ten zero-writes, all explained as duplicates. No pages, no retries. Without emptyReason, this batch would look exactly like the bug.' : 'Nothing written, and that is correct: the first delivery already wrote it. You just can’t tell that from here.' }
    if (!contract) return { tone: 'bad', text: `Lambda: Success. Errors: 0. SQS deleted all ${BATCH} messages. The store got 0 of ${expectedRows} rows, and there is nothing left to replay. Nothing screamed.` }
    if (bug === 'toolsoff') return { tone: 'good', text: `The hinted retry worked: ${written} rows landed, and the ${itemErrors} prose replies still reach ItemErrors so you can see the model drifting.` }
    if (failed > 0 && !reportFailures) return { tone: 'bad', text: `The handler returned ${failed} failures, but function_response_types is missing, so Lambda ignored the list and SQS deleted everything. The metric moved; the input is gone.` }
    if (failed > 0) return { tone: 'warn', text: `${failed} messages go back to the queue. After 5 receives they land in the DLQ with their bodies intact. EMF shows ${unexplained > 0 ? `${unexplained} unexplained zero-writes` : `${itemErrors} item errors`}, so the alarm can fire.` }
    return { tone: 'warn', text: `WARN: SQS deletes the batch, but UnexplainedZeroWrites = ${unexplained} goes to CloudWatch. The alarm is your only safety net now.` }
  }

  const step: ActivityStep = done
    ? { id: 'done', title: 'Batch finished', caption: story, durationMs: 1 }
    : running
      ? { id: `msg-${processed}`, title: `Processing message ${processed + 1} of ${BATCH}`, caption: story, durationMs: 1 }
      : { id: 'idle', title: 'Pick a bug, then run the batch', caption: story, durationMs: 1 }

  const result = done ? headline() : null

  return (
    <BlogActivityFrame
      title="One SQS batch through the memory-extract Lambda"
      steps={[step]}
      playback={false}
      renderStage={() => (
        <div>
          <div className="flex flex-wrap gap-1" role="group" aria-label="What goes wrong">
            {BUGS.map((item) => (
              <Pill key={item.id} pressed={bug === item.id} onClick={() => reset(setBug)(item.id)} data-activity-bug={item.id}>
                {item.label}
              </Pill>
            ))}
          </div>

          <ol aria-label="Messages in the batch" className="!mb-0 !mt-4 grid !list-none grid-cols-5 gap-1.5 !pl-0">
            {results.map((r, i) => (
              <Tile key={i} index={i} result={r} verdict={verdicts[i]} contract={contract} processed={i < seen} />
            ))}
          </ol>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-3">
              <p className="!my-0 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">What AWS shows</p>
              <Stat label="Lambda Errors" value="0" tone="good" />
              <Stat label="Invocation" value="Success" tone="good" />
              <Stat label="SQS deleted" value={seen === 0 ? '–' : done ? BATCH - returned : '…'} />
              <Stat label="Back to queue" value={done ? returned : '–'} tone={returned > 0 ? 'warn' : 'plain'} />
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-3">
              <p className="!my-0 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">What landed in the store</p>
              <Stat label="Rows written" value={seen === 0 ? '–' : written} tone={done && lost ? 'bad' : 'plain'} />
              <Stat label="Rows that should exist" value={expectedRows} />
              <p className="!my-0 mt-2 text-[0.7rem] leading-4 text-slate-500 dark:text-slate-400">
                {bug === 'duplicate' ? 'Already there from the first delivery.' : 'Counted from what the store confirmed, not memories.length.'}
              </p>
            </div>

            <div className={`rounded-xl border p-3 ${contract ? 'border-slate-200 dark:border-slate-800' : 'border-dashed border-slate-300 dark:border-slate-700'}`}>
              <p className="!my-0 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">EMF in Hrr/Pipelines</p>
              {contract ? (
                <>
                  <Stat label="Messages" value={seen} />
                  <Stat label="ItemsWritten" value={written} />
                  <Stat label="ItemErrors" value={itemErrors} tone={itemErrors > 0 ? 'warn' : 'plain'} />
                  <Stat label="ZeroWrites" value={zero} tone={zero > 0 ? 'warn' : 'plain'} />
                  <Stat label="UnexplainedZeroWrites" value={unexplained} tone={unexplained > 0 ? 'bad' : 'plain'} />
                  <Stat label="FailedMessages" value={failed} tone={failed > 0 ? 'bad' : 'plain'} />
                </>
              ) : (
                <p className="!my-0 mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">No contract, no counts. The handler returns nothing it measured, so there is nothing to graph or alarm on.</p>
              )}
            </div>
          </div>

          <pre className="!mb-0 !mt-3 overflow-x-auto whitespace-pre-wrap break-words rounded-xl !bg-slate-950 !px-3 !py-2 font-mono !text-[0.7rem] !leading-5 !text-slate-200">
            <span className="text-slate-500">{'// handler returns\n'}</span>
            {done ? `{ "batchItemFailures": [${failureIds.map((id) => `{ "itemIdentifier": "${id}" }`).join(', ')}] }` : '…'}
            {done && failureIds.length > 0 && !reportFailures ? <span className="text-rose-300">{'\n// ignored: ReportBatchItemFailures is off'}</span> : null}
          </pre>

          {result ? (
            <p
              data-activity-result=""
              aria-live="polite"
              className={`!mb-0 !mt-3 rounded-xl px-3 py-2 text-sm font-semibold ${
                result.tone === 'bad'
                  ? 'bg-rose-100 dark:bg-rose-950/50 text-rose-950 dark:text-rose-100'
                  : result.tone === 'warn'
                    ? 'bg-amber-100 dark:bg-amber-950/50 text-amber-950 dark:text-amber-100'
                    : 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-950 dark:text-emerald-100'
              }`}
            >
              {result.text}
            </p>
          ) : null}

          <div className="mt-4 grid gap-3 border-t border-slate-200 dark:border-slate-800 pt-3 sm:grid-cols-3">
            <div>
              <p className="!my-0 mb-1 text-xs font-semibold text-slate-500 dark:text-slate-400">Handler</p>
              <div className="flex flex-wrap gap-1" role="group" aria-label="Handler">
                <Pill pressed={!contract} onClick={() => reset(setContract)(false)} data-activity-contract="off">Just don&apos;t throw</Pill>
                <Pill pressed={contract} onClick={() => reset(setContract)(true)} data-activity-contract="on">The contract</Pill>
              </div>
            </div>
            <div>
              <p className="!my-0 mb-1 text-xs font-semibold text-slate-500 dark:text-slate-400">Unexplained empty</p>
              <div className="flex flex-wrap gap-1" role="group" aria-label="Policy for unexplained empties">
                {(['WARN', 'FAIL'] as const).map((p) => (
                  <Pill key={p} pressed={policy === p} disabled={!contract} onClick={() => reset(setPolicy)(p)} data-activity-policy={p}>{p}</Pill>
                ))}
              </div>
            </div>
            <div>
              <p className="!my-0 mb-1 text-xs font-semibold text-slate-500 dark:text-slate-400">function_response_types</p>
              <div className="flex flex-wrap gap-1" role="group" aria-label="ReportBatchItemFailures">
                <Pill pressed={reportFailures} onClick={() => reset(setReportFailures)(true)} data-activity-report="on">ReportBatchItemFailures</Pill>
                <Pill pressed={!reportFailures} onClick={() => reset(setReportFailures)(false)} data-activity-report="off">Missing</Pill>
              </div>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                data-activity-run=""
                disabled={running}
                onClick={() => setProcessed(reducedMotion ? BATCH : 0)}
                className="rounded-full bg-sky-600 px-4 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {done ? 'Run again' : running ? 'Processing…' : 'Run the batch'}
              </button>
              <div className="flex items-center gap-1" role="group" aria-label="Playback speed">
                {SPEEDS.map((value) => (
                  <Pill key={value} pressed={speed === value} onClick={() => setSpeed(value)} data-activity-speed={String(value)}>
                    {value}x
                  </Pill>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    />
  )
}
