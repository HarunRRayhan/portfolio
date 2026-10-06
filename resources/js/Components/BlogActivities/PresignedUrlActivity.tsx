'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { useMemo, useState } from 'react'
import BlogActivityFrame, { type ActivityStep } from '@/Components/BlogActivities/BlogActivityFrame'

type AccessMode = 'presign' | 'public'

function stepsFor(mode: AccessMode): ActivityStep[] {
  return [
    {
      id: 'private',
      title: 'The object is private',
      caption: 'A direct GET has no signature. S3 answers 403.',
      durationMs: 3800,
    },
    {
      id: 'sign',
      title: 'Your API signs one URL',
      caption: 'The API holds the IAM credentials. It signs one method, one key, and an expiry. The browser never sees the access key.',
      durationMs: 4200,
    },
    {
      id: 'fetch',
      title: 'The browser talks to S3',
      caption: 'The bytes go between the browser and S3. Your API does not proxy the file.',
      durationMs: 3800,
    },
    {
      id: 'tomorrow',
      title: mode === 'public' ? 'Tomorrow it is still public' : 'Tomorrow the URL is dead',
      caption:
        mode === 'public'
          ? 'A public object stays readable for anyone who has the URL. Expiry does not apply.'
          : 'The same pre-signed URL returns 403 after the expiry. It was a temporary key for that one object.',
      durationMs: 4600,
    },
  ]
}

function Box({ label, tone }: { label: string; tone: string }) {
  return (
    <div className={`rounded-xl border px-3 py-4 text-center text-sm font-semibold ${tone}`}>{label}</div>
  )
}

function Stage({ stepId, mode, speed }: { stepId: string; mode: AccessMode; speed: number }) {
  const reducedMotion = useReducedMotion()
  const denied = stepId === 'private' || (stepId === 'tomorrow' && mode === 'presign')
  const allowed = stepId === 'fetch' || (stepId === 'tomorrow' && mode === 'public')
  const signing = stepId === 'sign'

  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-3 items-center gap-2">
        <Box label="Browser" tone="border-slate-200 bg-white text-slate-900" />
        <Box label="Your API" tone={signing ? 'border-sky-300 bg-sky-50 text-sky-950' : 'border-slate-200 bg-slate-50 text-slate-700'} />
        <Box label="S3 object" tone={allowed ? 'border-emerald-300 bg-emerald-50 text-emerald-950' : 'border-slate-200 bg-slate-50 text-slate-800'} />
      </div>
      <motion.div
        key={`${stepId}-${mode}`}
        initial={reducedMotion ? false : { opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 / speed }}
        className={`rounded-xl px-4 py-3 text-sm font-medium ${
          denied ? 'bg-rose-50 text-rose-900' : allowed ? 'bg-emerald-50 text-emerald-950' : 'bg-sky-50 text-sky-950'
        }`}
      >
        {denied ? '403 AccessDenied' : null}
        {allowed ? '200 OK, one object' : null}
        {signing ? 'SigV4 signature for GET or PUT, one key, one expiry' : null}
      </motion.div>
    </div>
  )
}

export default function PresignedUrlActivity() {
  const [mode, setMode] = useState<AccessMode>('presign')
  const steps = useMemo(() => stepsFor(mode), [mode])

  return (
    <BlogActivityFrame
      title="Who can fetch the object"
      steps={steps}
      renderStage={(stepIndex, speed) => <Stage stepId={steps[stepIndex].id} mode={mode} speed={speed} />}
      footer={({ setStepIndex }) => (
        <>
          <button
            type="button"
            data-activity-branch="public"
            aria-pressed={mode === 'public'}
            onClick={() => {
              setMode('public')
              setStepIndex(3)
            }}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
              mode === 'public' ? 'bg-amber-600 text-white' : 'border border-slate-200 text-slate-700'
            }`}
          >
            Make the object public
          </button>
          <button
            type="button"
            data-activity-branch="presign"
            aria-pressed={mode === 'presign'}
            onClick={() => {
              setMode('presign')
              setStepIndex(3)
            }}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
              mode === 'presign' ? 'bg-sky-600 text-white' : 'border border-slate-200 text-slate-700'
            }`}
          >
            Hand out a pre-signed URL
          </button>
        </>
      )}
    />
  )
}
