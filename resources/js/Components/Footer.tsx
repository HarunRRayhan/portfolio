'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Link } from '@inertiajs/react'
import { ArrowRight } from 'lucide-react'
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
        <footer className="border-t border-blue-900/40 bg-slate-950 text-white">
            <div className="container mx-auto px-4 py-16 sm:py-20">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="rounded-[2rem] border border-blue-500/10 bg-white/5 p-6 shadow-2xl backdrop-blur sm:p-8 lg:p-10"
                >
                    <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
                        <div>
                            <div className="inline-flex items-center gap-3 rounded-full border border-blue-400/15 bg-white/5 px-4 py-2 text-sm text-slate-300">
                                <Logo className="h-6 w-6" />
                                Available for remote consulting
                            </div>

                            <h2 className="mt-6 max-w-xl text-3xl font-semibold tracking-tight sm:text-4xl">
                                Let’s build something reliable, clean, and easy to ship.
                            </h2>

                            <p className="mt-4 max-w-xl text-base leading-7 text-slate-300 sm:text-lg">
                                I help teams improve AWS architecture, infrastructure automation, and production
                                delivery without unnecessary process overhead.
                            </p>

                            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                                <Link href="/contact">
                                    <Button className="w-full rounded-full bg-blue-50 px-6 text-slate-950 hover:bg-white sm:w-auto">
                                        Start a project
                                    </Button>
                                </Link>
                                <Link href="/blog">
                                    <Button
                                        variant="outline"
                                        className="w-full rounded-full border-blue-400/20 bg-transparent px-6 text-white hover:bg-blue-500/10 sm:w-auto"
                                    >
                                        Read the blog
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </Link>
                            </div>
                        </div>

                        <div className="grid gap-8 sm:grid-cols-2">
                            {links.map((group) => (
                                <div key={group.title}>
                                    <div className="text-sm font-medium uppercase tracking-[0.18em] text-slate-400">
                                        {group.title}
                                    </div>
                                    <ul className="mt-4 space-y-3">
                                        {group.items.map((item) => (
                                            <li key={item.label}>
                                                <Link
                                                    href={item.href}
                                                    className="text-slate-200 transition hover:text-white"
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

                <div className="mt-10 flex flex-col gap-6 border-t border-blue-500/10 pt-8 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-slate-400">
                        © {new Date().getFullYear()} Harun R. Rayhan. Built with a focus on clarity and reliability.
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
                                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-blue-400/15 bg-white/5 text-slate-300 transition hover:border-blue-300/30 hover:bg-blue-500/10 hover:text-white"
                            >
                                <Icon className="h-5 w-5" />
                            </motion.a>
                        ))}
                    </div>
                </div>
            </div>
        </footer>
    )
}
