'use client'

import React from 'react'
import { Code2, Cloud, ShieldCheck, Workflow } from 'lucide-react'
import { Image } from './Image'
import { getImageUrl } from '../lib/imageUtils'

const skills = [
    {
        icon: Code2,
        title: 'Software',
        description:
            'PHP and Laravel most of the time. Python, Go, or Node when the project is already in that language.',
    },
    {
        icon: Cloud,
        title: 'AWS',
        description:
            'The account you already have: network, compute, and the bill.',
    },
    {
        icon: Workflow,
        title: 'Releases',
        description:
            'Terraform and a pipeline, so a release is a button instead of a checklist.',
    },
    {
        icon: ShieldCheck,
        title: 'Production',
        description:
            'Metrics, logs, and an alarm that pages a person.',
    },
]

export function SkillsSection() {
    return (
        <section className="relative overflow-hidden bg-white dark:bg-slate-900 py-20 sm:py-24">
            {/* Subtle grid */}
            <div
                className="pointer-events-none absolute inset-0 opacity-[0.15]"
                style={{
                    backgroundImage:
                        'linear-gradient(rgba(15,23,42,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.04) 1px, transparent 1px)',
                    backgroundSize: '48px 48px',
                }}
            />
            <div className="container relative mx-auto">
                <div className="mx-auto max-w-3xl text-center">
                    <div className="mb-4 inline-flex items-center gap-2 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/80 px-3 py-1.5">
                        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-600 dark:text-slate-300">
                            Capabilities
                        </span>
                    </div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl lg:text-5xl">
                        What the work usually is
                    </h2>
                    <p className="mt-4 text-base leading-7 text-slate-600 dark:text-slate-300 sm:text-lg">
                        The app, the AWS account, and the release after I leave.
                    </p>
                </div>

                <div className="mt-14 grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
                    {/* Skills grid */}
                    <div className="grid gap-4 sm:grid-cols-2">
                        {skills.map((skill) => (
                            <div
                                key={skill.title}
                                className="group rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 transition hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-sm"
                            >
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-300 transition group-hover:border-slate-300 dark:group-hover:border-slate-700">
                                    <skill.icon className="h-5 w-5" />
                                </div>
                                <h3 className="mt-5 text-lg font-semibold text-slate-900 dark:text-white">{skill.title}</h3>
                                <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">{skill.description}</p>
                            </div>
                        ))}

                    </div>

                    {/* Right column: Certifications + style card */}
                    <div className="relative">
                        <div className="absolute -inset-6 rounded-[2rem] bg-gradient-to-br from-amber-500/8 via-transparent to-amber-500/8 blur-3xl" />
                        <div className="relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm sm:p-6">
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-600 dark:text-slate-300">
                                        Credentials
                                    </p>
                                    <h3 className="mt-2 text-xl font-bold text-slate-900 dark:text-white">
                                        All 12 AWS certifications
                                    </h3>
                                </div>
                                <div className="rounded-md border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 text-[11px] font-semibold text-amber-700 dark:text-amber-300">
                                    AWS + IaC
                                </div>
                            </div>

                            <div className="mt-4 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3">
                                <Image
                                    src={getImageUrl('/images/aws-certifications.webp')}
                                    alt="AWS certifications"
                                    className="h-auto w-full rounded-lg object-contain"
                                    loading="lazy"
                                    decoding="async"
                                />
                            </div>

                            <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-300">
                                I write the change, review the plan, and leave notes the next person can run.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
