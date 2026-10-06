'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { useState } from 'react'
import BlogActivityFrame, { type ActivityStep } from '@/Components/BlogActivities/BlogActivityFrame'

const STEPS: ActivityStep[] = [
  {
    id: 'describe',
    title: 'Describe the resources',
    caption: 'Terraform uses HCL. Pulumi uses a language you already write, often TypeScript. Both are a description of what should exist.',
    durationMs: 4000,
  },
  {
    id: 'plan',
    title: 'Preview the change',
    caption: 'terraform plan and pulumi preview both list creates, updates, and deletes before anything changes.',
    durationMs: 4000,
  },
  {
    id: 'apply',
    title: 'Apply it',
    caption: 'Both tools call the cloud APIs and create the resources. The language does not skip this step.',
    durationMs: 3800,
  },
  {
    id: 'state',
    title: 'State records what exists',
    caption: 'Both keep a state file that maps your description to real resource IDs. That file can hold secrets.',
    durationMs: 4400,
  },
]

const ROWS = [
  { id: 'describe', left: 'main.tf', right: 'index.ts' },
  { id: 'plan', left: 'terraform plan', right: 'pulumi preview' },
  { id: 'apply', left: 'terraform apply', right: 'pulumi up' },
  { id: 'state', left: 'terraform.tfstate', right: 'pulumi state' },
] as const

function Column({ heading, rows, activeId, speed }: { heading: string; rows: string[]; activeId: string; speed: number }) {
  const reducedMotion = useReducedMotion()

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <p className="!my-0 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{heading}</p>
      <div className="mt-3 space-y-2">
        {ROWS.map((row, index) => {
          const active = row.id === activeId

          return (
            <motion.div
              key={row.id}
              animate={{ opacity: active ? 1 : 0.45 }}
              transition={{ duration: reducedMotion ? 0 : 0.25 / speed }}
              className={`rounded-lg px-3 py-2 font-mono text-xs ${active ? 'bg-slate-950 text-white' : 'bg-white text-slate-600'}`}
            >
              {index + 1}. {rows[index]}
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

export default function TerraformPulumiActivity() {
  const [choice, setChoice] = useState<'hcl' | 'typescript' | null>(null)
  const detail =
    choice === 'hcl'
      ? 'The team already writes HCL, so stay on Terraform. You still review the plan, and you still lock the state.'
      : choice === 'typescript'
        ? 'TypeScript next to the app fits Pulumi. You still review the preview, and you still lock the state.'
        : undefined

  return (
    <BlogActivityFrame
      title="Same loop, different language"
      steps={STEPS}
      detail={detail}
      renderStage={(stepIndex, speed) => (
        <div className="grid gap-3 sm:grid-cols-2">
          <Column heading="Terraform" rows={ROWS.map((row) => row.left)} activeId={STEPS[stepIndex].id} speed={speed} />
          <Column heading="Pulumi" rows={ROWS.map((row) => row.right)} activeId={STEPS[stepIndex].id} speed={speed} />
        </div>
      )}
      footer={() => (
        <>
          <button
            type="button"
            data-activity-branch="hcl"
            aria-pressed={choice === 'hcl'}
            onClick={() => setChoice('hcl')}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
              choice === 'hcl' ? 'bg-violet-700 text-white' : 'border border-slate-200 text-slate-700'
            }`}
          >
            The team already writes HCL
          </button>
          <button
            type="button"
            data-activity-branch="typescript"
            aria-pressed={choice === 'typescript'}
            onClick={() => setChoice('typescript')}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
              choice === 'typescript' ? 'bg-sky-600 text-white' : 'border border-slate-200 text-slate-700'
            }`}
          >
            I want TypeScript next to the app
          </button>
        </>
      )}
    />
  )
}
