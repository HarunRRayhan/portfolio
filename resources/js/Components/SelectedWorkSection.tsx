'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { ArrowUpRight, Cloud, ShieldCheck, Workflow } from 'lucide-react'
import { Link } from '@inertiajs/react'

const items = [
    {
        icon: Cloud,
        title: 'AWS architecture that is easier to operate',
        description:
            'Tighten AWS designs so they are simpler to operate, easier to secure, and less expensive to keep alive.',
        points: ['Resilience and failure-mode checks', 'Security and IAM review', 'Cost and service right-sizing'],
        href: '/services/cloud-architecture',
        cta: 'Explore cloud architecture',
    },
    {
        icon: Workflow,
        title: 'Release flows that are easier to trust',
        description:
            'Turn fragile deployment steps into repeatable release flows that are easier to trust and maintain.',
        points: ['Infrastructure as code structure', 'Safer release pipelines', 'Lower-friction handoffs'],
        href: '/services/infrastructure-as-code',
        cta: 'See infrastructure automation',
    },
    {
        icon: ShieldCheck,
        title: 'Monitoring that helps before incidents do',
        description:
            'Make it easier to spot issues early, respond cleanly, and keep teams calm when traffic or complexity grows.',
        points: ['Signals that matter', 'Alerting that is actually actionable', 'Operational guardrails'],
        href: '/services/monitoring-observability',
        cta: 'Review observability work',
    },
]

export function SelectedWorkSection() {
    return (
        <section className="border-b border-slate-200 bg-slate-50 py-20 sm:py-24" id="selected-work">
            <div className="container mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="mx-auto max-w-3xl text-center"
                >
                    <p className="text-sm font-medium uppercase tracking-[0.22em] text-slate-500">
                        Selected work
                    </p>
                    <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-4xl lg:text-5xl">
                        The parts of delivery I pay closest attention to.
                    </h2>
                    <p className="mt-4 text-base leading-7 text-slate-600 sm:text-lg">
                        From cloud design to release automation and production visibility, I focus on the work that keeps teams moving without surprises.
                    </p>
                </motion.div>

                <div className="mt-14 grid gap-6 lg:grid-cols-3">
                    {items.map((item, index) => (
                        <motion.article
                            key={item.title}
                            initial={{ opacity: 0, y: 18 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: index * 0.08 }}
                            className="group rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_10px_40px_rgba(15,23,42,0.04)] transition hover:-translate-y-1 hover:border-slate-300 hover:shadow-[0_16px_50px_rgba(15,23,42,0.08)]"
                        >
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-sm ring-1 ring-slate-900/10">
                                <item.icon className="h-5 w-5" />
                            </div>

                            <div className="mt-5 inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                                {String(index + 1).padStart(2, '0')}
                            </div>

                            <h3 className="mt-4 text-xl font-semibold tracking-[-0.02em] text-slate-950">{item.title}</h3>
                            <p className="mt-3 text-sm leading-7 text-slate-600">{item.description}</p>

                            <ul className="mt-5 space-y-2">
                                {item.points.map((point) => (
                                    <li key={point} className="flex items-start gap-3 text-sm text-slate-600">
                                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                                        <span>{point}</span>
                                    </li>
                                ))}
                            </ul>

                            <Link
                                href={item.href}
                                className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-blue-700 transition group-hover:text-blue-800"
                            >
                                {item.cta}
                                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                            </Link>
                        </motion.article>
                    ))}
                </div>
            </div>
        </section>
    )
}
