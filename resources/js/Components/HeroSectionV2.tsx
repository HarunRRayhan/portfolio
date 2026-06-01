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
        <section className="relative overflow-hidden border-b border-slate-200/70 bg-white">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(124,58,237,0.14),_transparent_34%),radial-gradient(circle_at_80%_20%,_rgba(59,130,246,0.10),_transparent_28%),linear-gradient(180deg,rgba(248,250,252,0.96)_0%,rgba(255,255,255,0.98)_44%,rgba(248,250,252,1)_100%)]" />
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-200 to-transparent" />
            <div className="container relative mx-auto px-4 py-20 sm:py-24 lg:py-28">
                <div className="grid items-center gap-14 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20">
                    <motion.div
                        initial={{ opacity: 0, y: 18 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, ease: 'easeOut' }}
                        className="max-w-2xl"
                    >
                        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm backdrop-blur">
                            <span className="h-2 w-2 rounded-full bg-emerald-500" />
                            Senior Software Engineer & DevOps Consultant
                        </div>

                        <h1 className="max-w-xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
                            Building cloud systems that feel{' '}
                            <span className="bg-gradient-to-r from-violet-600 via-indigo-600 to-sky-600 bg-clip-text text-transparent">
                                calm, fast, and reliable
                            </span>
                            .
                        </h1>

                        <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600 sm:text-xl">
                            I help teams design, ship, and operate AWS infrastructure with strong automation,
                            cleaner release flows, and production-ready observability.
                        </p>

                        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                            <Link href="/contact">
                                <Button
                                    size="lg"
                                    className="group w-full rounded-full bg-slate-950 px-6 text-white shadow-lg shadow-slate-950/10 transition hover:-translate-y-0.5 hover:bg-slate-800 sm:w-auto"
                                >
                                    Contact me
                                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                                </Button>
                            </Link>
                            <Link href="/book">
                                <Button
                                    size="lg"
                                    variant="outline"
                                    className="w-full rounded-full border-slate-300 bg-white px-6 text-slate-900 shadow-sm hover:border-slate-400 hover:bg-slate-50 sm:w-auto"
                                >
                                    Book a session
                                </Button>
                            </Link>
                        </div>

                        <div className="mt-10 grid gap-3 sm:grid-cols-3">
                            {highlights.map((item) => (
                                <div
                                    key={item.label}
                                    className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm backdrop-blur"
                                >
                                    <div className="text-sm text-slate-500">{item.label}</div>
                                    <div className="mt-1 text-lg font-semibold text-slate-950">{item.value}</div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-8 space-y-3 text-sm text-slate-600">
                            {capabilities.map((item) => (
                                <div key={item} className="flex items-start gap-3">
                                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-violet-500" />
                                    <span>{item}</span>
                                </div>
                            ))}
                        </div>

                        <div className="mt-10 flex items-center gap-4">
                            <span className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">
                                Find me on
                            </span>
                            <div className="flex items-center gap-2">
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
                                        className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-950"
                                    >
                                        <Icon className="h-5 w-5" />
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
                        <div className="absolute -inset-6 rounded-[2rem] bg-gradient-to-br from-violet-200/30 via-transparent to-sky-200/30 blur-2xl" />
                        <div className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-sm font-medium text-slate-500">Current focus</div>
                                    <div className="mt-1 text-xl font-semibold text-slate-950">
                                        Reliable systems, better shipping
                                    </div>
                                </div>
                                <div className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                                    Available for consulting
                                </div>
                            </div>

                            <div className="mt-6 grid gap-3 sm:grid-cols-2">
                                {[
                                    'AWS architecture review',
                                    'Terraform and CI/CD cleanup',
                                    'Production observability',
                                    'Cost and reliability tuning',
                                ].map((item) => (
                                    <div
                                        key={item}
                                        className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm font-medium text-slate-700"
                                    >
                                        {item}
                                    </div>
                                ))}
                            </div>

                            <div className="mt-6 rounded-[1.5rem] border border-slate-200 bg-slate-950 p-5 text-white">
                                <div className="flex items-center justify-between gap-4">
                                    <div>
                                        <div className="text-sm text-slate-400">Delivery style</div>
                                        <div className="mt-1 text-lg font-semibold">Pragmatic, detailed, and low drama</div>
                                    </div>
                                    <div className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-slate-200">
                                        Remote-first
                                    </div>
                                </div>
                                <div className="mt-5 grid grid-cols-2 gap-3">
                                    {logos.map((logo) => (
                                        <div
                                            key={logo.name}
                                            className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-2"
                                        >
                                            <img
                                                src={logo.image}
                                                alt={logo.name}
                                                className="h-8 w-8 rounded-full bg-white/10 p-1.5"
                                            />
                                            <span className="text-sm font-medium text-slate-100">{logo.name}</span>
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
