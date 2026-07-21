import React, { useCallback, useEffect, useState } from 'react'
import { Head, Link, usePage } from '@inertiajs/react'
import { motion, AnimatePresence } from 'framer-motion'
import { getImageUrl } from '@/lib/imageUtils'
import { ArrowUpRight, Check, Copy } from 'lucide-react'
import { bioIcon } from '@/lib/bioIcons'

interface BioLink {
  id: number
  label: string
  url: string
  icon: string
  tab: string
}

const isInternal = (url: string) => url.startsWith('/')
const isMailto = (url: string) => url.startsWith('mailto:') || url.startsWith('tel:')

/** Tidy tab value for display — "default" becomes "Links". */
const displayTab = (tab: string): string => (tab === 'default' ? 'Links' : tab)

const SOCIAL_ICONS = ['instagram', 'tiktok', 'facebook', 'linkedin', 'x', 'twitter', 'youtube']

/** POST a click event to the server (fire-and-forget with keepalive). */
const trackClick = (id: number) => {
  try {
    fetch('/bio/click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
      body: JSON.stringify({ id }),
      keepalive: true,
    })
  } catch {
    // silently ignore tracking failures
  }
}

export default function Bio({ links = [] }: { links?: BioLink[] }) {
  const { url } = usePage()
  const canonicalUrl = typeof window !== 'undefined' ? window.location.href : 'https://harun.dev/bio'

  // Separate social (icon-only row) from regular (tabbed) links
  const socialLinks = links.filter((l) => SOCIAL_ICONS.includes(l.icon))
  const regularLinks = links.filter((l) => !SOCIAL_ICONS.includes(l.icon))

  // Group regular links by tab, preserving insertion order
  const tabMap = new Map<string, BioLink[]>()
  const tabOrder: string[] = []
  for (const link of regularLinks) {
    const t = link.tab || 'default'
    if (!tabMap.has(t)) {
      tabMap.set(t, [])
      tabOrder.push(t)
    }
    tabMap.get(t)!.push(link)
  }

  // Determine initial tab from URL query param, default to first
  const initialTab = (() => {
    const match = url.match(/[?&]tab=([^&]+)/)
    if (match) {
      const decoded = decodeURIComponent(match[1])
      if (tabOrder.includes(decoded)) return decoded
    }
    return tabOrder[0] || 'default'
  })()

  const [activeTab, setActiveTab] = useState(initialTab)
  const [copiedTab, setCopiedTab] = useState<string | null>(null)
  const currentLinks = tabMap.get(activeTab) ?? []

  // Sync URL when tab changes (replaceState, no page reload)
  useEffect(() => {
    const base = window.location.pathname
    const params = new URLSearchParams(window.location.search)
    if (activeTab === tabOrder[0] || (!activeTab && tabOrder.length <= 1)) {
      params.delete('tab')
    } else {
      params.set('tab', activeTab)
    }
    const qs = params.toString()
    const newUrl = qs ? `${base}?${qs}` : base
    window.history.replaceState(null, '', newUrl)
  }, [activeTab, tabOrder])

  const copyTabLink = useCallback(
    (tab: string) => {
      const base = window.location.origin + window.location.pathname
      const shareUrl = tab === tabOrder[0] ? base : `${base}?tab=${encodeURIComponent(tab)}`
      navigator.clipboard.writeText(shareUrl).then(() => {
        setCopiedTab(tab)
        setTimeout(() => setCopiedTab(null), 2000)
      })
    },
    [tabOrder],
  )

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

      <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 px-4 py-10 text-white sm:px-6 sm:py-12 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-xl flex-col items-center"
        >
          <div className="w-full rounded-3xl border border-white/10 bg-white/10 p-5 shadow-2xl shadow-slate-950/30 backdrop-blur sm:p-6 md:p-8">
            <div className="flex flex-col items-center text-center">
              <img
                src={getImageUrl('/images/profile/harun-profile.jpeg')}
                alt="Harun R. Rayhan"
                className="h-24 w-24 rounded-full border-4 border-white/15 object-cover shadow-lg"
                loading="eager"
                width={96}
                height={96}
              />

              <div className="mt-5 space-y-2">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-200/80">Harun.dev bio</p>
                <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Harun R. Rayhan</h1>
                <p className="text-sm text-slate-300 sm:text-base">
                  AWS DevOps · CloudOps · Infrastructure Automation
                </p>
              </div>

              {/* Scrollable social icons row (icons only) */}
              {socialLinks.length > 0 && (
                <div className="mt-4 w-full max-w-[340px]">
                  <div className="-mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 scrollbar-hide">
                    {socialLinks.map((link) => {
                      const Icon = bioIcon(link.icon)
                      return (
                        <a
                          key={link.url}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => trackClick(link.id)}
                          className="flex h-11 w-11 shrink-0 snap-start items-center justify-center rounded-2xl border border-white/10 bg-white/5 transition hover:bg-white/10 active:bg-white/15"
                          aria-label={link.label}
                        >
                          <Icon className="h-5 w-5 text-blue-200" />
                        </a>
                      )
                    })}
                  </div>
                </div>
              )}

              <p className="mt-5 max-w-md text-sm leading-6 text-slate-300 sm:text-base">
                I build and maintain practical cloud systems with a bias for clarity, reliability, and automation.
                Portfolio work, blog posts, and contact details live here.
              </p>

              {/* Tab navigation */}
              {tabOrder.length > 1 && (
                <nav aria-label="Link categories" className="mt-6 flex w-full gap-1.5 overflow-x-auto rounded-xl border border-white/10 bg-white/5 p-1">
                  {tabOrder.map((tab) => {
                    const isActive = tab === activeTab
                    return (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => setActiveTab(tab)}
                        className={`group relative flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-wider transition sm:text-sm ${
                          isActive
                            ? 'bg-blue-500/20 text-blue-200 shadow-sm'
                            : 'text-slate-400 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        {displayTab(tab)}

                        {/* Copy link button (visible on hover of active tab) */}
                        <span
                          onClick={(e) => {
                            e.stopPropagation()
                            copyTabLink(tab)
                          }}
                          className={`ml-1 inline-flex h-4 w-4 items-center justify-center rounded transition ${
                            isActive
                              ? 'opacity-60 hover:opacity-100 hover:bg-blue-400/20'
                              : 'hidden'
                          }`}
                          title="Copy link to this tab"
                        >
                          {copiedTab === tab ? (
                            <Check className="h-3 w-3 text-green-300" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </span>
                      </button>
                    )
                  })}
                </nav>
              )}

              {/* Link cards for active tab */}
              <nav aria-label={`${displayTab(activeTab)} links`} className="mt-6 grid w-full gap-3">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className="grid w-full gap-3"
                  >
                    {currentLinks.map((link) => {
                      const Icon = bioIcon(link.icon)
                      const internal = isInternal(link.url)
                      const mailish = isMailto(link.url)

                      const className =
                        'group flex min-h-[56px] items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5 text-left text-sm font-medium text-white transition hover:-translate-y-0.5 hover:border-blue-300/50 hover:bg-white/10 active:translate-y-0'

                      const content = (
                        <>
                          <span className="flex min-w-0 items-center gap-3">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-500/15 text-blue-200">
                              <Icon className="h-4 w-4" />
                            </span>
                            <span className="truncate">{link.label}</span>
                          </span>
                          <ArrowUpRight className="h-4 w-4 shrink-0 text-slate-400 transition group-hover:text-blue-200" />
                        </>
                      )

                      if (internal) {
                        return (
                          <Link key={`${link.label}-${link.url}`} href={link.url} className={className} onClick={() => trackClick(link.id)}>
                            {content}
                          </Link>
                        )
                      }

                      return (
                        <a
                          key={`${link.label}-${link.url}`}
                          href={link.url}
                          target={mailish ? undefined : '_blank'}
                          rel={mailish ? undefined : 'noopener noreferrer'}
                          onClick={() => trackClick(link.id)}
                          className={className}
                        >
                          {content}
                        </a>
                      )
                    })}
                  </motion.div>
                </AnimatePresence>

                {currentLinks.length === 0 && (
                  <p className="rounded-2xl border border-dashed border-white/15 px-4 py-6 text-center text-sm text-slate-400">
                    No links in this category yet.
                  </p>
                )}
              </nav>
            </div>
          </div>

          <footer className="mt-6 text-center text-xs text-slate-400">
            <a href="https://harun.dev" className="transition hover:text-slate-200">
              harun.dev
            </a>
            <span className="mx-2 text-slate-600">·</span>
            <span>© {new Date().getFullYear()} Harun R. Rayhan</span>
          </footer>
        </motion.div>
      </main>
    </>
  )
}

// Override the default PublicLayout — Bio is standalone (no site nav/footer).
;(Bio as any).layout = (page: React.ReactNode) => page
