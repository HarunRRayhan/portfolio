'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Code2, Cloud, Lightbulb, ShieldCheck, Workflow, Braces, Server, Cpu } from 'lucide-react'
import { Image } from './Image'
import { getImageUrl } from '../lib/imageUtils'

const skills = [
    {
        icon: Code2,
        title: 'Software engineering depth',
        description:
            'Polyglot engineering across backend systems, product delivery, and platform work — with a bias toward practical implementation.',
    },
    {
        icon: Cloud,
        title: 'AWS and cloud architecture',
        description:
            'Designing and operating reliable cloud systems with security, scalability, and cost control built in from the start.',
    },
    {
        icon: Workflow,
        title: 'Infrastructure automation',
        description:
            'Terraform, CI/CD, and deployment workflows that reduce manual overhead and make shipping safer.',
    },
    {
        icon: ShieldCheck,
        title: 'Production reliability',
        description:
            'Observability, alerting, and failure-mode thinking that keep systems calm when traffic or complexity grows.',
    },
]

const highlights = [
    { value: '17+', label: 'years building software' },
    { value: '12×', label: 'AWS certified' },
    { value: 'Lead', label: 'technical mentoring' },
]

const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.45 },
    },
}

export function SkillsSection() {
    return (
        <section className="relative overflow-hidden bg-white py-20 sm:py-24">
            {/* Subtle grid */}
            <div
                className="pointer-events-none absolute inset-0 opacity-[0.15]"
                style={{
                    backgroundImage:
                        'linear-gradient(rgba(15,23,42,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.04) 1px, transparent 1px)',
                    backgroundSize: '48px 48px',
                }}
            />
            <div className="container relative mx-auto px-4">
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="mx-auto max-w-3xl text-center"
                >
                    <div className="mb-4 inline-flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50/80 px-3 py-1.5">
                        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500">
                            Capabilities
                        </span>
                    </div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
                        Calm execution across{' '}
                        <span className="text-emerald-600 underline decoration-emerald-200 decoration-2 underline-offset-4">
                            code, cloud, and operations
                        </span>
                        .
                    </h2>
                    <p className="mt-4 text-base leading-7 text-slate-500 sm:text-lg">
                        The work usually sits at the intersection of engineering, DevOps, and platform thinking —
                        so the focus is on systems that are simple to ship and easy to support.
                    </p>
                </motion.div>

                <div className="mt-14 grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
                    {/* Skills grid */}
                    <div className="grid gap-4 sm:grid-cols-2">
                        {skills.map((skill) => (
                            <motion.div
                                key={skill.title}
                                variants={itemVariants}
                                initial="hidden"
                                whileInView="visible"
                                viewport={{ once: true }}
                                className="group rounded-xl border border-slate-200 bg-white p-6 transition hover:border-slate-300 hover:shadow-sm"
                            >
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600 transition group-hover:border-slate-300">
                                    <skill.icon className="h-5 w-5" />
                                </div>
                                <h3 className="mt-5 text-lg font-semibold text-slate-900">{skill.title}</h3>
                                <p className="mt-2 text-sm leading-7 text-slate-500">{skill.description}</p>
                            </motion.div>
                        ))}

                        {/* Quick highlights — terminal style */}
                        <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950 sm:col-span-2">
                            {/* Terminal bar */}
                            <div className="flex items-center gap-1.5 border-b border-slate-800 px-4 py-2">
                                <div className="h-2 w-2 rounded-full bg-red-500/80" />
                                <div className="h-2 w-2 rounded-full bg-yellow-500/80" />
                                <div className="h-2 w-2 rounded-full bg-emerald-500/80" />
                                <span className="ml-2 font-mono text-[10px] text-slate-500">quick-stats</span>
                            </div>
                            <div className="p-4">
                                <div className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500">
                                    ▼ Highlights
                                </div>
                                <div className="grid gap-2 sm:grid-cols-3">
                                    {highlights.map((item) => (
                                        <div
                                            key={item.label}
                                            className="rounded-lg border border-slate-700/60 bg-slate-900/60 px-4 py-3"
                                        >
                                            <div className="font-mono text-2xl font-bold tabular-nums text-emerald-400">
                                                {item.value}
                                            </div>
                                            <div className="mt-0.5 font-mono text-[11px] text-slate-400">{item.label}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right column: Certifications + style card */}
                    <div className="relative">
                        <div className="absolute -inset-6 rounded-[2rem] bg-gradient-to-br from-amber-500/8 via-transparent to-emerald-500/8 blur-3xl" />
                        <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400">
                                        Credentials
                                    </p>
                                    <h3 className="mt-2 text-xl font-bold text-slate-900">
                                        Proof of hands-on depth
                                    </h3>
                                </div>
                                <div className="rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
                                    AWS + IaC
                                </div>
                            </div>

                            <div className="mt-4 rounded-lg border border-slate-100 bg-slate-50 p-3">
                                <Image
                                    src={getImageUrl('/images/aws-certifications.png')}
                                    alt="AWS certifications"
                                    className="h-auto w-full rounded-lg object-contain"
                                />
                            </div>

                            <div className="mt-4 rounded-lg border border-slate-100 bg-slate-50/70 p-4">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600">
                                        <Cpu className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <div className="font-mono text-[11px] font-medium text-slate-400">Working style</div>
                                        <div className="text-sm font-semibold text-slate-900">
                                            Opinionated where it matters, flexible where it helps.
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
