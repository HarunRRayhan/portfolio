'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Code2, Cloud, Lightbulb, ShieldCheck, Workflow } from 'lucide-react'
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
    '17+ years building software',
    '12x AWS certified',
    'Technical leadership and mentoring',
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
        <section className="bg-white py-20 sm:py-24">
            <div className="container mx-auto px-4">
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="mx-auto max-w-3xl text-center"
                >
                    <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">
                        What I do best
                    </p>
                    <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl lg:text-5xl">
                        Calm execution across code, cloud, and operations.
                    </h2>
                    <p className="mt-4 text-base leading-7 text-slate-600 sm:text-lg">
                        The work usually sits at the intersection of engineering, DevOps, and platform thinking —
                        so the focus is on systems that are simple to ship and easy to support.
                    </p>
                </motion.div>

                <div className="mt-14 grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
                    <div className="grid gap-4 sm:grid-cols-2">
                        {skills.map((skill) => (
                            <motion.div
                                key={skill.title}
                                variants={itemVariants}
                                initial="hidden"
                                whileInView="visible"
                                viewport={{ once: true }}
                                className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm"
                            >
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-600/10 text-violet-700">
                                    <skill.icon className="h-6 w-6" />
                                </div>
                                <h3 className="mt-5 text-xl font-semibold text-slate-950">{skill.title}</h3>
                                <p className="mt-3 text-sm leading-7 text-slate-600">{skill.description}</p>
                            </motion.div>
                        ))}

                        <div className="rounded-3xl border border-slate-200 bg-slate-950 p-6 text-white shadow-sm sm:col-span-2">
                            <div className="text-sm font-medium uppercase tracking-[0.2em] text-slate-400">
                                Quick highlights
                            </div>
                            <div className="mt-5 grid gap-3 sm:grid-cols-3">
                                {highlights.map((item) => (
                                    <div key={item} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100">
                                        {item}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="relative">
                        <div className="absolute -inset-6 rounded-[2rem] bg-gradient-to-br from-violet-200/40 via-transparent to-sky-200/40 blur-3xl" />
                        <div className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] sm:p-6">
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">
                                        Certifications
                                    </p>
                                    <h3 className="mt-2 text-2xl font-semibold text-slate-950">
                                        Proof of hands-on depth
                                    </h3>
                                </div>
                                <div className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                                    AWS + IaC focused
                                </div>
                            </div>

                            <div className="mt-6 rounded-[1.75rem] border border-slate-200 bg-slate-50 p-4">
                                <Image
                                    src={getImageUrl('/images/aws-certifications.png')}
                                    alt="AWS certifications"
                                    className="h-auto w-full rounded-[1.25rem] object-contain"
                                />
                            </div>

                            <div className="mt-6 rounded-[1.5rem] border border-slate-200 bg-white p-5">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-600/10 text-violet-700">
                                        <Lightbulb className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium text-slate-500">Working style</div>
                                        <div className="text-base font-semibold text-slate-950">
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
