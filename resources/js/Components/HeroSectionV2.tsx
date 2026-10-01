'use client'

import React from 'react'
import { Button } from '@/Components/ui/button'
import { Github, Linkedin, Mail, Twitter } from '@/lib/icons'
import { ArrowRight } from 'lucide-react'
import { Link } from '@inertiajs/react'
import { getImageUrl } from '../lib/imageUtils'
import { caseStudyReaderTitle } from '@/lib/caseStudyTitle'

const highlights = [
    { label: 'Experience', value: '15+ years' },
    { label: 'Clients', value: '160+' },
    { label: 'Focus', value: 'AWS' },
]

const capabilities = [
    'The AWS account you already have',
    'Terraform and a pipeline the team can run',
    'Metrics, logs, and the bill',
]

export type HeroCaseStudy = {
    title?: string
    codename: string
    headlineOutcome: string
    industry?: string
    url: string
}

export function HeroSectionV2({ study = null }: { study?: HeroCaseStudy | null }) {
    const proofTitle = study ? caseStudyReaderTitle(study) : null

    return (
        <section className="relative overflow-hidden border-b border-slate-200 bg-slate-50">
            <div
                className="pointer-events-none absolute inset-0 opacity-[0.25]"
                style={{
                    backgroundImage:
                        'linear-gradient(rgba(15,23,42,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.06) 1px, transparent 1px)',
                    backgroundSize: '48px 48px',
                }}
            />

            <div className="container relative mx-auto py-16 sm:py-24 lg:py-28">
                <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
                    <div className="max-w-2xl">
                        <p className="mb-4 text-sm font-medium text-slate-600">DevOps consultant</p>

                        <h1 className="homepage-hero-copy max-w-2xl text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-[3.75rem] lg:leading-[1.1]">
                            I design, ship, and run{' '}
                            <span className="text-amber-600 underline decoration-amber-200 decoration-2 underline-offset-4">
                                AWS infrastructure
                            </span>
                            .
                        </h1>

                        <p className="homepage-hero-copy mt-5 max-w-xl text-lg leading-8 text-slate-600">
                            The account, the pipeline, and what happens after it ships.
                        </p>

                        <div className="mt-6 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
                            <Link href="/consultation">
                                <Button
                                    size="lg"
                                    className="group w-full rounded-lg bg-slate-900 px-6 text-white shadow-sm transition hover:bg-slate-800 active:scale-[0.98] sm:w-auto"
                                >
                                    Book a consult
                                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                                </Button>
                            </Link>
                            <Link
                                href="/blog"
                                className="inline-flex items-center justify-center px-2 py-2 text-sm font-medium text-slate-700 underline-offset-4 hover:text-slate-950 hover:underline sm:justify-start"
                            >
                                Read the notes
                            </Link>
                        </div>

                        <div className="mt-8 grid grid-cols-3 border-y border-slate-200 py-4">
                            {highlights.map((item, i) => (
                                <div
                                    key={item.label}
                                    className={i > 0 ? 'border-l border-slate-200 pl-3 sm:pl-6' : ''}
                                >
                                    <div className="font-mono text-lg font-semibold tabular-nums text-slate-900 sm:text-2xl">
                                        {item.value}
                                    </div>
                                    <div className="mt-0.5 text-[11px] font-medium uppercase tracking-[0.12em] text-slate-600 sm:text-xs">
                                        {item.label}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-8 hidden space-y-3 text-sm text-slate-600 sm:block">
                            {capabilities.map((item) => (
                                <div key={item} className="flex items-start gap-3">
                                    <span className="mt-1.5 flex h-4 w-4 items-center justify-center rounded border border-amber-200 bg-amber-50 text-[10px] font-bold text-amber-600">
                                        ✓
                                    </span>
                                    <span>{item}</span>
                                </div>
                            ))}
                        </div>

                        <div className="mt-8 hidden items-center gap-4 sm:flex">
                            <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                                Connect
                            </span>
                            <div className="flex items-center gap-1.5">
                                {[
                                    { href: 'https://github.com/HarunRRayhan', label: 'GitHub', icon: Github },
                                    { href: 'https://x.com/harundotdev', label: 'Twitter', icon: Twitter },
                                    { href: 'https://www.linkedin.com/in/harunrrayhan/', label: 'LinkedIn', icon: Linkedin },
                                    { href: 'mailto:me@harun.dev?subject=Hello%20Harun', label: 'Email', icon: Mail },
                                ].map(({ href, label, icon: Icon }) => (
                                    <a
                                        key={label}
                                        href={href}
                                        target={href.startsWith('mailto:') ? undefined : '_blank'}
                                        rel={href.startsWith('mailto:') ? undefined : 'noopener noreferrer'}
                                        aria-label={label}
                                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:text-slate-900 motion-safe:hover:-translate-y-0.5 motion-safe:active:scale-95"
                                    >
                                        <Icon className="h-4 w-4" />
                                    </a>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                        <div className="flex items-center gap-4">
                            <img
                                src={getImageUrl('/images/profile/harun-bio.jpg')}
                                alt="Harun R. Rayhan"
                                width={72}
                                height={72}
                                className="h-16 w-16 rounded-full object-cover sm:h-[4.5rem] sm:w-[4.5rem]"
                            />
                            <div>
                                <p className="text-sm font-semibold text-slate-950">Harun R. Rayhan</p>
                                <p className="mt-1 text-sm text-slate-600">Available for remote consulting.</p>
                            </div>
                        </div>

                        {study && proofTitle ? (
                            <Link href={study.url} className="mt-5 block rounded-xl border border-slate-200 bg-slate-50 p-4 transition hover:border-slate-300">
                                <p className="text-xs font-medium text-amber-800">{study.industry || study.codename}</p>
                                <p className="mt-2 text-base font-semibold leading-snug text-slate-950">{proofTitle}</p>
                                <p className="mt-2 text-sm leading-6 text-slate-600">{study.headlineOutcome}</p>
                                <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-slate-900">
                                    Read the case study
                                    <ArrowRight className="h-4 w-4" />
                                </span>
                            </Link>
                        ) : (
                            <Link href="/case-studies" className="mt-5 block rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 transition hover:border-slate-300">
                                Case studies from real engagements, with the client name left out.
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </section>
    )
}
