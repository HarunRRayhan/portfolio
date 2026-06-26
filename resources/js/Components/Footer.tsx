'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Link } from '@inertiajs/react'
import { ArrowRight, Terminal } from 'lucide-react'
import { Github, Linkedin, Mail, Twitter } from '@/lib/icons'
import { Button } from '@/Components/ui/button'
import { Logo } from '@/Components/Logo'

const links = [
    {
        title: 'Explore',
        items: [
            { label: 'Home', href: '/' },
            { label: 'Blog', href: '/blog' },
            { label: 'About', href: '/about' },
            { label: 'Contact', href: '/contact' },
        ],
    },
    {
        title: 'Legal',
        items: [
            { label: 'Privacy', href: '/privacy' },
            { label: 'Terms', href: '/terms' },
        ],
    },
]

const socials = [
    { href: 'https://github.com/HarunRRayhan', label: 'GitHub', icon: Github },
    { href: 'https://x.com/HarunRRayhan', label: 'Twitter', icon: Twitter },
    { href: 'https://www.linkedin.com/in/harunrrayhan/', label: 'LinkedIn', icon: Linkedin },
    { href: 'mailto:me@harun.dev?subject=Hello%20Harun', label: 'Email', icon: Mail },
]

export function Footer() {
    return (
        <footer className="relative border-t border-slate-800 bg-slate-950 text-white">
            {/* Subtle grid */}
            <div
                className="pointer-events-none absolute inset-0 opacity-[0.05]"
                style={{
                    backgroundImage:
                        'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
                    backgroundSize: '48px 48px',
                }}
            />
            <div className="container relative mx-auto px-4 py-16 sm:py-20">
                {/* CTA section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 shadow-sm backdrop-blur sm:p-8 lg:p-10"
                >
                    <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
                        <div>
                            <div className="inline-flex items-center gap-2 rounded-md border border-slate-700 bg-slate-800/80 px-3 py-1.5">
                                <Terminal className="h-3.5 w-3.5 text-emerald-400" />
                                <span className="font-mono text-[11px] font-medium text-slate-300">
                                    Available for remote consulting
                                </span>
                            </div>

                            <h2 className="mt-6 max-w-xl text-3xl font-bold tracking-tight sm:text-4xl">
                                Let&rsquo;s build something reliable, clean, and easy to ship.
                            </h2>

                            <p className="mt-4 max-w-xl text-base leading-7 text-slate-400 sm:text-lg">
                                I help teams improve AWS architecture, infrastructure automation, and production
                                delivery without unnecessary process overhead.
                            </p>

                            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                                <Link href="/contact">
                                    <Button className="w-full rounded-lg bg-white px-6 text-slate-900 transition hover:bg-slate-100 active:scale-[0.98] sm:w-auto">
                                        Start a project
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </Link>
                                <Link href="/blog">
                                    <Button
                                        variant="outline"
                                        className="w-full rounded-lg border-slate-700 bg-transparent px-6 text-slate-300 transition hover:border-slate-600 hover:bg-slate-800 active:scale-[0.98] sm:w-auto"
                                    >
                                        Read the blog
                                    </Button>
                                </Link>
                            </div>
                        </div>

                        <div className="grid gap-8 sm:grid-cols-2">
                            {links.map((group) => (
                                <div key={group.title}>
                                    <div className="font-mono text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-500">
                                        {group.title}
                                    </div>
                                    <ul className="mt-4 space-y-2.5">
                                        {group.items.map((item) => (
                                            <li key={item.label}>
                                                <Link
                                                    href={item.href}
                                                    className="text-sm text-slate-400 transition hover:text-white"
                                                >
                                                    {item.label}
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>

                {/* Bottom bar */}
                <div className="mt-10 flex flex-col gap-6 border-t border-slate-800 pt-8 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-slate-500">
                        &copy; {new Date().getFullYear()} Harun R. Rayhan. Built with a focus on clarity and reliability.
                    </p>

                    <div className="flex items-center gap-2">
                        {socials.map(({ href, label, icon: Icon }) => (
                            <motion.a
                                key={label}
                                href={href}
                                target={href.startsWith('mailto:') ? undefined : '_blank'}
                                rel={href.startsWith('mailto:') ? undefined : 'noopener noreferrer'}
                                aria-label={label}
                                whileHover={{ y: -2 }}
                                whileTap={{ scale: 0.96 }}
                                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-700 bg-slate-800/60 text-slate-400 transition hover:border-slate-600 hover:text-white"
                            >
                                <Icon className="h-4 w-4" />
                            </motion.a>
                        ))}
                    </div>
                </div>
            </div>
        </footer>
    )
}
