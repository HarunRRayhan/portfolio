'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Link, usePage } from '@inertiajs/react'
import { ArrowRight, Terminal } from 'lucide-react'
import { Github, Linkedin, Mail, Twitter } from '@/lib/icons'
import { Button } from '@/Components/ui/button'
import { Logo } from '@/Components/Logo'
import { SubscribeForm } from '@/Components/SubscribeForm'

type FooterLink = {
    label: string
    href: string
    // Raw file responses (llms.txt, feeds) must use a plain anchor. Inertia's <Link>
    // would try to handle them as SPA navigations and break.
    external?: boolean
}

type FooterLinkGroup = {
    title: string
    items: FooterLink[]
}

const links: FooterLinkGroup[] = [
    {
        title: 'Explore',
        items: [
            { label: 'Home', href: '/' },
            { label: 'Blog', href: '/blog' },
            { label: 'About', href: '/about' },
            { label: 'Sponsor', href: '/sponsor-me' },
            { label: 'Contact', href: '/contact' },
            { label: 'Bio', href: '/bio' },
        ],
    },
    {
        title: 'Legal',
        items: [
            { label: 'Privacy', href: '/privacy' },
            { label: 'Terms', href: '/terms' },
        ],
    },
    {
        title: 'For AI Agents',
        items: [
            { label: 'llms.txt', href: '/llms.txt', external: true },
            { label: 'llms-full.txt', href: '/llms-full.txt', external: true },
        ],
    },
]

const socials = [
    { href: 'https://github.com/HarunRRayhan', label: 'GitHub', icon: Github },
    { href: 'https://x.com/harundotdev', label: 'Twitter', icon: Twitter },
    { href: 'https://www.linkedin.com/in/harunrrayhan/', label: 'LinkedIn', icon: Linkedin },
    { href: 'mailto:me@harun.dev?subject=Hello%20Harun', label: 'Email', icon: Mail },
]

const newsletterAvatars = [
    '/images/newsletter/avatar-1.svg',
    '/images/newsletter/avatar-2.svg',
    '/images/newsletter/avatar-3.svg',
]

export function Footer() {
    const { newsletter } = usePage().props as { newsletter?: { subscriberCount?: number } }
    const subscriberCount = newsletter?.subscriberCount ?? 0
    const subscriberLabel = subscriberCount === 1 ? 'reader' : 'readers'
    const [avatarUrls] = React.useState(() => {
        const firstIndex = Math.floor(Math.random() * newsletterAvatars.length)
        const secondIndex =
            (firstIndex + 1 + Math.floor(Math.random() * (newsletterAvatars.length - 1))) % newsletterAvatars.length

        return [newsletterAvatars[firstIndex] ?? newsletterAvatars[0], newsletterAvatars[secondIndex] ?? newsletterAvatars[1]]
    })

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
            <div className="container relative mx-auto py-16 sm:py-20">
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
                                                {item.external ? (
                                                    <a
                                                        href={item.href}
                                                        className="text-sm text-slate-400 transition hover:text-white"
                                                    >
                                                        {item.label}
                                                    </a>
                                                ) : (
                                                    <Link
                                                        href={item.href}
                                                        className="text-sm text-slate-400 transition hover:text-white"
                                                    >
                                                        {item.label}
                                                    </Link>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>

                {/* Newsletter sign-up */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.08 }}
                    className="mt-8 grid gap-8 rounded-xl border border-slate-800 bg-slate-900/60 p-6 shadow-sm backdrop-blur sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center"
                >
                    <div>
                        <div className="flex items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-[0.15em] text-emerald-400">
                            <Mail className="h-3.5 w-3.5" />
                            Weekly newsletter
                        </div>
                        <h2 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl">
                            Practical notes, once a week.
                        </h2>
                        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
                            New articles and useful engineering lessons, without the inbox noise.
                        </p>
                        <div className="mt-5 max-w-md">
                            <SubscribeForm source="footer" theme="slate" />
                        </div>
                    </div>

                    <div className="flex items-center gap-4 rounded-xl border border-slate-800 bg-slate-950/60 p-4 lg:max-w-xs">
                        <div className="flex shrink-0 -space-x-2" aria-hidden="true">
                            <img
                                src={avatarUrls[0]}
                                alt=""
                                className="h-9 w-9 rounded-full border-2 border-slate-950 bg-emerald-100 object-cover"
                            />
                            <img
                                src={avatarUrls[1]}
                                alt=""
                                className="h-9 w-9 rounded-full border-2 border-slate-950 bg-emerald-100 object-cover"
                            />
                            <span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-slate-950 bg-slate-800 text-xs font-semibold text-slate-300">
                                +
                            </span>
                        </div>
                        <p className="text-sm leading-5 text-slate-400">
                            Join <span className="font-semibold text-white">{subscriberCount.toLocaleString()}</span> other {subscriberLabel}.
                        </p>
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
