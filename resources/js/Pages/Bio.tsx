'use client'

import { Head, Link } from '@inertiajs/react'
import { motion } from 'framer-motion'
import { getImageUrl } from '@/lib/imageUtils'
import { BookOpen, Home, MessageCircle } from 'lucide-react'
import { Github, Linkedin, Mail, Twitter } from '@/lib/icons'

const links = [
  { href: '/', label: 'Home', icon: Home, internal: true },
  { href: '/blog', label: 'Blog', icon: BookOpen, internal: true },
  { href: '/contact', label: 'Contact', icon: MessageCircle, internal: true },
  { href: 'https://github.com/HarunRRayhan', label: 'GitHub', icon: Github },
  { href: 'https://www.linkedin.com/in/harunrrayhan/', label: 'LinkedIn', icon: Linkedin },
  { href: 'https://x.com/HarunRRayhan', label: 'X', icon: Twitter },
  { href: 'mailto:me@harun.dev?subject=Hello%20Harun', label: 'Email', icon: Mail },
]

export default function Bio() {
  const canonicalUrl = typeof window !== 'undefined' ? window.location.href : 'https://harun.dev/bio'

  return (
    <>
      <Head>
        <title>Harun Ray | Bio</title>
        <meta
          name="description"
          content="Harun R. Rayhan's bio page with quick links to his portfolio, blog, contact details, and social profiles."
        />
        <meta name="keywords" content="Harun Ray, bio, portfolio, AWS DevOps, CloudOps, links" />
        <meta property="og:title" content="Harun Ray | Bio" />
        <meta
          property="og:description"
          content="Quick links to Harun R. Rayhan's portfolio, blog, contact details, and social profiles."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={canonicalUrl} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Harun Ray | Bio" />
        <meta
          name="twitter:description"
          content="Quick links to Harun R. Rayhan's portfolio, blog, contact details, and social profiles."
        />
        <link rel="canonical" href={canonicalUrl} />
      </Head>

      <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 px-4 py-12 text-white sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="mx-auto flex min-h-[calc(100vh-6rem)] w-full max-w-xl items-center"
        >
          <div className="w-full rounded-3xl border border-white/10 bg-white/10 p-6 shadow-2xl shadow-slate-950/30 backdrop-blur md:p-8">
            <div className="flex flex-col items-center text-center">
              <img
                src={getImageUrl('/images/profile/harun-profile.jpeg')}
                alt="Harun R. Rayhan"
                className="h-24 w-24 rounded-full border-4 border-white/15 object-cover shadow-lg"
              />

              <div className="mt-5 space-y-2">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-200/80">Harun.dev bio</p>
                <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Harun R. Rayhan</h1>
                <p className="text-sm text-slate-300 sm:text-base">AWS DevOps · CloudOps · Infrastructure Automation</p>
              </div>

              <p className="mt-5 max-w-md text-sm leading-6 text-slate-300 sm:text-base">
                I build and maintain practical cloud systems with a bias for clarity, reliability, and automation.
                Portfolio work, blog posts, and contact details live here.
              </p>

              <div className="mt-8 grid w-full gap-3">
                {links.map(({ href, label, icon: Icon, internal }) => {
                  const className =
                    'flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm font-medium text-white transition hover:border-blue-300/50 hover:bg-white/10 hover:-translate-y-0.5'

                  const content = (
                    <>
                      <span className="flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/15 text-blue-200">
                          <Icon className="h-4 w-4" />
                        </span>
                        <span>{label}</span>
                      </span>
                      <span className="text-xs uppercase tracking-[0.18em] text-slate-400">Open</span>
                    </>
                  )

                  return internal ? (
                    <Link key={label} href={href} className={className}>
                      {content}
                    </Link>
                  ) : (
                    <a
                      key={label}
                      href={href}
                      target={href.startsWith('mailto:') ? undefined : '_blank'}
                      rel={href.startsWith('mailto:') ? undefined : 'noopener noreferrer'}
                      className={className}
                    >
                      {content}
                    </a>
                  )
                })}
              </div>
            </div>
          </div>
        </motion.div>
      </main>
    </>
  )
}
