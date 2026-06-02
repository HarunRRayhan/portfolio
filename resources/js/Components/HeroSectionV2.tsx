'use client'

import React from 'react'
import { Button } from '@/Components/ui/button'
import { motion } from 'framer-motion'
import { Github, Linkedin, Mail, Twitter } from '@/lib/icons'
import { ArrowRight } from 'lucide-react'
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

export function HeroSectionV2() {
    return (
        <section className="relative overflow-hidden border-b border-blue-100 bg-[linear-gradient(180deg,rgba(239,246,255,0.78)_0%,rgba(255,255,255,0.98)_72%)]">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-200 to-transparent" />
            <div className="container relative mx-auto px-4 py-20 sm:py-24 lg:py-28">
                <div className="grid items-center gap-14 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20">
                    <motion.div
                        initial={{ opacity: 0, y: 18 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, ease: 'easeOut' }}
                        className="max-w-2xl"
                    >
                        <div className="mb-6 inline-flex items-center gap-2 rounded border border-blue-100 bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">
                            <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                            Senior Software Engineer & DevOps Consultant
                        </div>

                        <h1 className="max-w-xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl lg:text-[3.75rem] lg:leading-[1.1]">
                            Building cloud systems that feel{' '}
                            <span className="bg-gradient-to-r from-blue-700 via-blue-600 to-slate-700 bg-clip-text text-transparent">
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
                                    className="group w-full rounded-full bg-blue-700 px-6 text-white shadow-none transition hover:-translate-y-0.5 hover:bg-blue-600 sm:w-auto"
                                >
                                    Contact me
                                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                                </Button>
                            </Link>
                            <Link href="/book">
                                <Button
                                    size="lg"
                                    variant="outline"
                                    className="w-full rounded-full border-blue-200 bg-white px-6 text-slate-900 shadow-none hover:border-blue-300 hover:bg-white sm:w-auto"
                                >
                                    Book a session
                                </Button>
                            </Link>
                        </div>

                        <div className="mt-10 flex border-y border-blue-100 py-5">
                            {highlights.map((item, i) => (
                                <div
                                    key={item.label}
                                    className={`flex-1${i > 0 ? ' border-l border-blue-100 pl-6' : ''}${i < highlights.length - 1 ? ' pr-6' : ''}`}
                                >
                                    <div className="text-2xl font-semibold tabular-nums text-slate-950">{item.value}</div>
                                    <div className="mt-0.5 text-xs font-medium uppercase tracking-[0.1em] text-slate-400">{item.label}</div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-8 space-y-3 text-sm text-slate-600">
                            {capabilities.map((item) => (
                                <div key={item} className="flex items-start gap-3">
                                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                                    <span>{item}</span>
                                </div>
                            ))}
                        </div>

                        <div className="mt-10 flex items-center gap-4">
                            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                                Find me on
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
                                        className="inline-flex h-9 w-9 items-center justify-center rounded border border-blue-100 bg-white text-slate-500 transition hover:border-blue-300 hover:text-slate-950"
                                    >
                                        <Icon className="h-4 w-4" />
                                    </motion.a>
                                ))}
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
                        className="relative"
                    >
                        <div className="relative overflow-hidden rounded-2xl border border-blue-100 bg-white p-6 shadow-[0_4px_24px_rgba(15,23,42,0.06)]">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <div className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">Current focus</div>
                                    <div className="mt-2 text-xl font-semibold leading-tight text-slate-950">
                                        Reliable systems, better shipping
                                    </div>
                                </div>
                                <div className="shrink-0 rounded border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-800">
                                    Available for consulting
                                </div>
                            </div>

                            <div className="mt-5 grid gap-2 sm:grid-cols-2">
                                {[
                                    'AWS architecture review',
                                    'Terraform and CI/CD cleanup',
                                    'Production observability',
                                    'Cost and reliability tuning',
                                ].map((item) => (
                                    <div
                                        key={item}
                                        className="rounded border border-blue-100 bg-blue-50/60 px-4 py-3 text-sm font-medium text-slate-700"
                                    >
                                        {item}
                                    </div>
                                ))}
                            </div>

                            <div className="mt-5 rounded-xl border border-slate-900 bg-gradient-to-br from-slate-950 via-slate-950 to-blue-950 p-5 text-white">
                                <div className="flex items-center justify-between gap-4">
                                    <div>
                                        <div className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">Delivery style</div>
                                        <div className="mt-1.5 text-base font-semibold leading-snug">Pragmatic, detailed, and low drama</div>
                                    </div>
                                    <div className="shrink-0 rounded border border-white/15 px-3 py-1 text-xs font-medium text-slate-300">
                                        Remote-first
                                    </div>
                                </div>
                                <div className="mt-5 grid grid-cols-2 gap-2">
                                    {logos.map((logo) => (
                                        <div
                                            key={logo.name}
                                            className="flex items-center gap-3 rounded border border-white/10 bg-white/5 px-3 py-2"
                                        >
                                            <img
                                                src={logo.image}
                                                alt={logo.name}
                                                className="h-7 w-7 rounded bg-white/10 p-1"
                                            />
                                            <span className="text-sm font-medium text-slate-200">{logo.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    )
}
