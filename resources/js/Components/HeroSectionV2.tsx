'use client'

import React from 'react'
import { Button } from '@/Components/ui/button'
import { motion } from 'framer-motion'
import { Github, Linkedin, Mail, Twitter } from '@/lib/icons'
import { ArrowRight, Terminal } from 'lucide-react'
import { Link } from '@inertiajs/react'
import { getImageUrl } from '../lib/imageUtils'

const logos = [
    { name: 'AWS', image: getImageUrl('/images/logos/tech/aws-logo.svg') },
    { name: 'Terraform', image: getImageUrl('/images/logos/tech/terraform-logo.svg') },
    { name: 'Kubernetes', image: getImageUrl('/images/logos/tech/kubernetes-logo.svg') },
    { name: 'Docker', image: getImageUrl('/images/tech/docker.svg') },
    { name: 'GitHub', image: getImageUrl('/images/logos/tech/github-logo.svg') },
    { name: 'Golang', image: getImageUrl('/images/logos/tech/golang-logo.svg') },
    { name: 'Jenkins', image: getImageUrl('/images/logos/tech/jenkins-logo.svg') },
    { name: 'DevOps', image: getImageUrl('/images/logos/tech/devops-logo.svg') },
]

const highlights = [
    { label: 'Experience', value: '10+ years' },
    { label: 'Clients', value: '120+ served' },
    { label: 'Focus', value: 'AWS + DevOps' },
]

const capabilities = [
    'Cloud architecture and platform modernization',
    'Infrastructure automation with Terraform and CI/CD',
    'Production reliability, observability, and cost control',
]

const terminalLines = [
    { prompt: './check consulting', output: '' },
    { prompt: '', output: '▶ Systems infrastructure ................ operational ✓' },
    { prompt: '', output: '▶ AWS certifications ............... 12 active ✓' },
    { prompt: '', output: '▶ Current availability ................. open ✓' },
    { prompt: './contact --start-project', output: '' },
]

export function HeroSectionV2() {
    return (
        <section className="relative overflow-hidden border-b border-slate-200 bg-slate-50">
            {/* Subtle grid overlay for technical feel */}
            <div
                className="pointer-events-none absolute inset-0 opacity-[0.25]"
                style={{
                    backgroundImage:
                        'linear-gradient(rgba(15,23,42,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.06) 1px, transparent 1px)',
                    backgroundSize: '48px 48px',
                }}
            />
            {/* Gradient glow accents */}
            <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-amber-500/5 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-amber-500/5 blur-3xl" />

            <div className="container relative mx-auto px-4 py-20 sm:py-24 lg:py-32">
                <div className="grid items-center gap-14 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20">
                    {/* Left: Main content */}
                    <motion.div
                        initial={{ opacity: 0, y: 18 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, ease: 'easeOut' }}
                        className="max-w-2xl"
                    >
                        {/* Terminal-style badge */}
                        <div className="mb-6 inline-flex items-center gap-2.5 rounded-lg border border-slate-200 bg-white/80 px-3.5 py-2 shadow-sm backdrop-blur-sm">
                            <Terminal className="h-3.5 w-3.5 text-slate-400" />
                            <span className="font-mono text-[11px] font-medium uppercase tracking-wider text-slate-500">
                                Senior Software Engineer & DevOps Consultant
                            </span>
                            <span className="h-1 w-1 rounded-full bg-slate-300" />
                            <span className="relative flex h-2 w-2">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
                                <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
                            </span>
                        </div>

                        <h1 className="max-w-2xl text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-[3.75rem] lg:leading-[1.1]">
                            Building cloud systems that feel{' '}
                            <span className="text-amber-600 underline decoration-amber-200 decoration-2 underline-offset-4">
                                calm, fast, and reliable
                            </span>
                            .
                        </h1>

                        <p className="mt-6 max-w-xl text-lg leading-8 text-slate-500 sm:text-xl">
                            I help teams design, ship, and operate AWS infrastructure with strong automation,
                            cleaner release flows, and production-ready observability.
                        </p>

                        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                            <Link href="/contact">
                                <Button
                                    size="lg"
                                    className="group w-full rounded-lg bg-slate-900 px-6 text-white shadow-sm transition hover:bg-slate-800 active:scale-[0.98] sm:w-auto"
                                >
                                    Start a project
                                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                                </Button>
                            </Link>
                            <Link href="/services">
                                <Button
                                    size="lg"
                                    variant="outline"
                                    className="w-full rounded-lg border-slate-200 bg-white px-6 text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 active:scale-[0.98] sm:w-auto"
                                >
                                    View services
                                </Button>
                            </Link>
                        </div>

                        {/* Stats row */}
                        <div className="mt-10 flex border-y border-slate-200 py-5">
                            {highlights.map((item, i) => (
                                <div
                                    key={item.label}
                                    className={`flex-1${i > 0 ? ' border-l border-slate-200 pl-6' : ''}${i < highlights.length - 1 ? ' pr-6' : ''}`}
                                >
                                    <div className="font-mono text-2xl font-semibold tabular-nums text-slate-900">
                                        {item.value}
                                    </div>
                                    <div className="mt-0.5 text-xs font-medium uppercase tracking-[0.12em] text-slate-400">
                                        {item.label}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Capabilities */}
                        <div className="mt-8 space-y-3 text-sm text-slate-600">
                            {capabilities.map((item) => (
                                <div key={item} className="flex items-start gap-3">
                                    <span className="mt-1.5 flex h-4 w-4 items-center justify-center rounded border border-amber-200 bg-amber-50 text-[10px] font-bold text-amber-600">
                                        ✓
                                    </span>
                                    <span>{item}</span>
                                </div>
                            ))}
                        </div>

                        {/* Social links */}
                        <div className="mt-10 flex items-center gap-4">
                            <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                                Connect
                            </span>
                            <div className="flex items-center gap-1.5">
                                {[
                                    { href: 'https://github.com/HarunRRayhan', label: 'GitHub', icon: Github },
                                    { href: 'https://x.com/HarunRRayhan', label: 'Twitter', icon: Twitter },
                                    { href: 'https://www.linkedin.com/in/harunrrayhan/', label: 'LinkedIn', icon: Linkedin },
                                    { href: 'mailto:me@harun.dev?subject=Hello%20Harun', label: 'Email', icon: Mail },
                                ].map(({ href, label, icon: Icon }) => (
                                    <motion.a
                                        key={label}
                                        href={href}
                                        target={href.startsWith('mailto:') ? undefined : '_blank'}
                                        rel={href.startsWith('mailto:') ? undefined : 'noopener noreferrer'}
                                        aria-label={label}
                                        whileHover={{ y: -2 }}
                                        whileTap={{ scale: 0.96 }}
                                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:text-slate-900"
                                    >
                                        <Icon className="h-4 w-4" />
                                    </motion.a>
                                ))}
                            </div>
                        </div>
                    </motion.div>

                    {/* Right: Terminal-style card */}
                    <motion.div
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: 'easeOut', delay: 0.15 }}
                        className="relative"
                    >
                        {/* Terminal window */}
                        <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
                            {/* Title bar */}
                            <div className="flex items-center gap-1.5 border-b border-slate-800 px-4 py-2.5">
                                <div className="h-2.5 w-2.5 rounded-full bg-red-500/80" />
                                <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/80" />
                                <div className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
                                <span className="ml-2 font-mono text-[11px] text-slate-500">systems-engineer — zsh</span>
                                <span className="ml-auto font-mono text-[10px] text-slate-600">80×24</span>
                            </div>
                            {/* Terminal body */}
                            <div className="space-y-2 p-4 font-mono text-sm sm:p-5">
                                {terminalLines.map((line, i) =>
                                    line.prompt ? (
                                        <div key={i} className="flex items-start gap-2">
                                            <span className="shrink-0 text-emerald-400">$</span>
                                            <span className="text-slate-300">{line.prompt}</span>
                                            <span className="animate-pulse text-emerald-400">█</span>
                                        </div>
                                    ) : (
                                        <div key={i} className="flex items-center gap-2 pl-5">
                                            <span className="text-emerald-400">✓</span>
                                            <span className="text-slate-400">{line.output}</span>
                                        </div>
                                    ),
                                )}
                                {/* Animated cursor line */}
                                <div className="flex items-center gap-2 pt-1">
                                    <span className="text-emerald-400">$</span>
                                    <span className="h-4 w-2 animate-pulse bg-emerald-400/70" />
                                </div>
                            </div>
                        </div>

                        {/* Focus card below terminal */}
                        <div className="mt-4 rounded-xl border border-slate-200 bg-white/90 p-5 shadow-sm backdrop-blur-sm">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400">
                                        Current focus
                                    </div>
                                    <div className="mt-1.5 text-base font-semibold leading-snug text-slate-900">
                                        Reliable systems, better shipping
                                    </div>
                                </div>
                                <div className="shrink-0 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
                                    Available for consulting
                                </div>
                            </div>

                            <div className="mt-4 grid gap-1.5 sm:grid-cols-2">
                                {[
                                    'AWS architecture review',
                                    'Terraform and CI/CD cleanup',
                                    'Production observability',
                                    'Cost and reliability tuning',
                                ].map((item) => (
                                    <div
                                        key={item}
                                        className="rounded-md border border-slate-200 bg-slate-50/80 px-3 py-2 text-sm font-medium text-slate-700"
                                    >
                                        {item}
                                    </div>
                                ))}
                            </div>

                            {/* Tech badges */}
                            <div className="mt-4 flex flex-wrap gap-1.5 border-t border-slate-100 pt-4">
                                {logos.slice(0, 4).map((logo) => (
                                    <div
                                        key={logo.name}
                                        className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2 py-1"
                                    >
                                        <img src={logo.image} alt={logo.name} className="h-4 w-4" />
                                        <span className="font-mono text-[11px] font-medium text-slate-600">
                                            {logo.name}
                                        </span>
                                    </div>
                                ))}
                                <div className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2 py-1 font-mono text-[11px] text-slate-400">
                                    +4 more
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    )
}
