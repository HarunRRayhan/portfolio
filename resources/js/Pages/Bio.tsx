import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Head, Link, usePage } from '@inertiajs/react'
import { motion, AnimatePresence, type Variants } from 'framer-motion'
import { QRCodeSVG } from 'qrcode.react'
import { getImageUrl } from '@/lib/imageUtils'
import { Check, Copy, MoreVertical, Share2, X } from 'lucide-react'
import { bioIcon } from '@/lib/bioIcons'

interface BioLink {
  id: number
  label: string
  url: string
  icon: string
  thumbnail_url: string | null
  featured: boolean
  tab: string
  tab_slug: string
}

const isInternal = (url: string) => url.startsWith('/')
const isMailto = (url: string) => url.startsWith('mailto:') || url.startsWith('tel:')

/** Tidy tab value for display — "default" becomes "Links". */
const displayTab = (tab: string): string => (tab === 'default' ? 'Links' : tab)

const SOCIAL_ICONS = ['instagram', 'tiktok', 'youtube', 'facebook', 'threads', 'github', 'linkedin', 'twitter']

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

// Subtle film-grain texture, generated once as a data URI so the warm
// background reads as textured paper rather than a flat fill.
const GRAIN_BG =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")"

// One orchestrated reveal per tab: the container staggers its children in
// rather than everything fading in at once.
const containerVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
}
const itemVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
}

/**
 * Renders a link as its real anchor/Link element (internal routes use
 * Inertia's Link, everything else is a plain anchor), with click tracking
 * wired in either way. Used as an invisible full-bleed hit target so a link
 * card can still host a separate, non-nested "share" button.
 */
function LinkAnchor({ link, className }: { link: BioLink; className: string }) {
  const internal = isInternal(link.url)
  const mailish = isMailto(link.url)

  if (internal) {
    return (
      <Link href={link.url} onClick={() => trackClick(link.id)} className={className} aria-label={link.label} />
    )
  }

  return (
    <a
      href={link.url}
      target={mailish ? undefined : '_blank'}
      rel={mailish ? undefined : 'noopener noreferrer'}
      onClick={() => trackClick(link.id)}
      className={className}
      aria-label={link.label}
    />
  )
}

/** Copy-link / native-share dropdown anchored under a single link's ⋮ button. */
function ShareDropdown({ url, label, onClose }: { url: string; label: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false)
  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function'

  const copy = () => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(onClose, 900)
    })
  }

  const share = () => {
    navigator.share({ title: label, url }).catch(() => {})
    onClose()
  }

  return (
    <div
      role="menu"
      className="absolute right-0 top-full z-20 mt-2 w-44 overflow-hidden rounded-xl border border-[#e4d7c4] bg-[#fffaf6] py-1 text-left shadow-lg shadow-[#2b2320]/10"
    >
      {canShare && (
        <button
          type="button"
          role="menuitem"
          onClick={share}
          className="flex w-full items-center gap-2 px-3.5 py-2.5 font-mono text-xs text-[#3a2f27] transition hover:bg-[#f1e6d3]"
        >
          <Share2 className="h-3.5 w-3.5" /> Share
        </button>
      )}
      <button
        type="button"
        role="menuitem"
        onClick={copy}
        className="flex w-full items-center gap-2 px-3.5 py-2.5 font-mono text-xs text-[#3a2f27] transition hover:bg-[#f1e6d3]"
      >
        {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
        {copied ? 'Copied' : 'Copy link'}
      </button>
    </div>
  )
}

/** The per-link share trigger (⋮ button) plus its dropdown, self-contained. */
function ShareTrigger({
  link,
  isOpen,
  onToggle,
  onClose,
  menuRef,
  cornerClassName = '',
}: {
  link: BioLink
  isOpen: boolean
  onToggle: () => void
  onClose: () => void
  menuRef: React.RefObject<HTMLDivElement | null>
  /** Rounds the button's own corners to match whichever card edge it sits on
   *  now that the card no longer clips overflow (the dropdown needs to be
   *  able to paint outside the card's rounded border). */
  cornerClassName?: string
}) {
  return (
    <div className="relative" ref={isOpen ? menuRef : null}>
      <button
        type="button"
        onClick={onToggle}
        aria-label={`Share ${link.label}`}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        className={`flex h-full w-11 shrink-0 items-center justify-center border-l border-[#e4d7c4]/70 text-[#8a6a45] transition hover:bg-[#f1e6d3] hover:text-[#2b2320] ${cornerClassName}`}
      >
        <MoreVertical className="h-4 w-4" />
      </button>
      {isOpen && <ShareDropdown url={link.url} label={link.label} onClose={onClose} />}
    </div>
  )
}

/** Whole-page share sheet: native share, copy-link, and a scannable QR code. */
function PageShareSheet({ url, onClose }: { url: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false)
  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function'

  const copy = () => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const share = () => {
    navigator.share({ title: 'Harun R. Rayhan', url }).catch(() => {})
  }

  return (
    <div className="absolute right-0 top-full z-30 mt-2 w-72 rounded-2xl border border-[#e4d7c4] bg-[#fffaf6] p-4 shadow-xl shadow-[#2b2320]/10">
      <div className="flex items-center justify-between">
        <p className="font-mono text-xs font-semibold uppercase tracking-wider text-[#5b4a3a]">Share this page</p>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="rounded-full p-1 text-[#8a6a45] transition hover:bg-[#f1e6d3] hover:text-[#2b2320]"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="mt-3 flex justify-center rounded-xl border border-[#e4d7c4] bg-white p-3">
        <QRCodeSVG value={url} size={144} bgColor="#ffffff" fgColor="#2b2320" level="M" />
      </div>

      <div className="mt-3 flex gap-2">
        {canShare && (
          <button
            type="button"
            onClick={share}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-[#e4d7c4] bg-white px-3 py-2 font-mono text-xs font-medium text-[#3a2f27] transition hover:bg-[#f1e6d3]"
          >
            <Share2 className="h-3.5 w-3.5" /> Share
          </button>
        )}
        <button
          type="button"
          onClick={copy}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-[#e4d7c4] bg-white px-3 py-2 font-mono text-xs font-medium text-[#3a2f27] transition hover:bg-[#f1e6d3]"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? 'Copied' : 'Copy link'}
        </button>
      </div>
    </div>
  )
}

export default function Bio({ links = [] }: { links?: BioLink[] }) {
  const { url } = usePage()
  const canonicalUrl = typeof window !== 'undefined' ? window.location.href : 'https://harun.dev/bio'

  // Separate social (icon-only row) from regular (tabbed) links
  const socialLinks = links.filter((l) => SOCIAL_ICONS.includes(l.icon))
  const regularLinks = links.filter((l) => !SOCIAL_ICONS.includes(l.icon))

  // Group regular links by tab slug, preserving insertion order
  interface TabGroup {
    slug: string
    label: string
    links: BioLink[]
  }
  const tabGroups: TabGroup[] = []
  const tabMap = new Map<string, TabGroup>()
  for (const link of regularLinks) {
    const slug = link.tab_slug || 'default'
    const existing = tabMap.get(slug)
    if (existing) {
      existing.links.push(link)
    } else {
      const group: TabGroup = { slug, label: link.tab || 'default', links: [link] }
      tabMap.set(slug, group)
      tabGroups.push(group)
    }
  }

  // Determine initial tab slug from URL query param, default to first
  const initialSlug = (() => {
    const match = url.match(/[?&]tab=([^&]+)/)
    if (match) {
      const decoded = decodeURIComponent(match[1])
      if (tabMap.has(decoded)) return decoded
    }
    return tabGroups[0]?.slug || 'default'
  })()

  const [activeSlug, setActiveSlug] = useState(initialSlug)
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null)
  const [openMenu, setOpenMenu] = useState<number | 'page' | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const activeGroup = tabMap.get(activeSlug)
  const currentLinks = activeGroup?.links ?? []

  // Featured links (with a thumbnail) render as hero cards instead of being
  // duplicated in the standard list.
  const featuredLinks = currentLinks.filter((l) => l.featured && l.thumbnail_url)
  const standardLinks = currentLinks.filter((l) => !(l.featured && l.thumbnail_url))

  // Sync URL when tab changes (replaceState, no page reload)
  useEffect(() => {
    const base = window.location.pathname
    const params = new URLSearchParams(window.location.search)
    if (activeSlug === tabGroups[0]?.slug || tabGroups.length <= 1) {
      params.delete('tab')
    } else {
      params.set('tab', activeSlug)
    }
    const qs = params.toString()
    const newUrl = qs ? `${base}?${qs}` : base
    window.history.replaceState(null, '', newUrl)
  }, [activeSlug, tabGroups])

  const copyTabLink = useCallback(
    (slug: string) => {
      const base = window.location.origin + window.location.pathname
      const shareUrl = slug === tabGroups[0]?.slug ? base : `${base}?tab=${encodeURIComponent(slug)}`
      navigator.clipboard.writeText(shareUrl).then(() => {
        setCopiedSlug(slug)
        setTimeout(() => setCopiedSlug(null), 2000)
      })
    },
    [tabGroups],
  )

  // Close whichever share menu is open on an outside click or Escape.
  useEffect(() => {
    if (openMenu === null) return
    const onPointerDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpenMenu(null)
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenMenu(null)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [openMenu])

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

      <main className="relative min-h-screen overflow-hidden bg-[#f7f1e8] px-4 py-10 text-[#2b2320] sm:px-6 sm:py-14 lg:px-8">
        {/* Layered warm glow */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_20%_-10%,rgba(217,157,89,0.35),transparent),radial-gradient(ellipse_55%_45%_at_100%_110%,rgba(184,84,31,0.22),transparent)]" />
        {/* Fine grain for depth over the flat fill */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.05] mix-blend-multiply"
          style={{ backgroundImage: GRAIN_BG, backgroundSize: '160px 160px' }}
        />

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="relative mx-auto flex min-h-[calc(100vh-6rem)] w-full max-w-xl flex-col items-center pt-12"
        >
          {/* Whole-page share button */}
          <div className="absolute right-0 top-0" ref={openMenu === 'page' ? menuRef : null}>
            <button
              type="button"
              onClick={() => setOpenMenu(openMenu === 'page' ? null : 'page')}
              aria-label="Share this page"
              aria-haspopup="menu"
              aria-expanded={openMenu === 'page'}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[#e4d7c4] bg-[#fffaf6]/90 text-[#5b4a3a] shadow-sm backdrop-blur transition hover:border-[#c98a4b] hover:text-[#2b2320]"
            >
              <Share2 className="h-4 w-4" />
            </button>
            {openMenu === 'page' && <PageShareSheet url={canonicalUrl} onClose={() => setOpenMenu(null)} />}
          </div>

          <div className="flex flex-col items-center text-center">
            <div className="relative">
              <div className="absolute inset-0 -z-10 scale-110 rounded-full bg-gradient-to-br from-[#e8b374] to-[#b8541f] opacity-40 blur-xl" />
              <img
                src={getImageUrl('/images/profile/harun-profile.jpeg')}
                alt="Harun R. Rayhan"
                className="h-24 w-24 rounded-full border-4 border-[#fffaf6] object-cover shadow-lg shadow-[#2b2320]/10"
                loading="eager"
                width={96}
                height={96}
              />
            </div>

            <div className="mt-5 space-y-1.5">
              <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.32em] text-[#b8541f]">
                Harun.dev bio
              </p>
              <h1 className="font-display text-3xl font-semibold tracking-tight text-[#2b2320] sm:text-4xl">
                Harun R. Rayhan
              </h1>
              <p className="font-mono text-sm text-[#6b5d4f] sm:text-base">
                AWS DevOps · CloudOps · Infrastructure Automation
              </p>
            </div>

            {/* Monochrome social icon row */}
            {socialLinks.length > 0 && (
              <div className="mt-5 flex flex-wrap items-center justify-center gap-1">
                {socialLinks.map((link) => {
                  const Icon = bioIcon(link.icon)
                  return (
                    <a
                      key={link.id}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => trackClick(link.id)}
                      aria-label={link.label}
                      className="flex h-10 w-10 items-center justify-center rounded-full text-[#4a3b2e] transition hover:-translate-y-0.5 hover:text-[#b8541f]"
                    >
                      <Icon className="h-[18px] w-[18px]" />
                    </a>
                  )
                })}
              </div>
            )}

            {/* Tab navigation */}
            {tabGroups.length > 1 && (
              <nav
                aria-label="Link categories"
                className="mt-7 flex w-full gap-1 overflow-x-auto rounded-full border border-[#e4d7c4] bg-[#fffaf6]/70 p-1"
              >
                {tabGroups.map((group) => {
                  const isActive = group.slug === activeSlug
                  return (
                    <button
                      key={group.slug}
                      type="button"
                      onClick={() => setActiveSlug(group.slug)}
                      className={`relative flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-2 font-mono text-xs font-medium uppercase tracking-wider transition sm:text-[13px] ${
                        isActive
                          ? 'bg-[#2b2320] text-[#f7f1e8] shadow-sm'
                          : 'text-[#6b5d4f] hover:bg-[#f1e6d3] hover:text-[#2b2320]'
                      }`}
                    >
                      {displayTab(group.label)}

                      {/* Copy link button (visible on the active tab) */}
                      <span
                        onClick={(e) => {
                          e.stopPropagation()
                          copyTabLink(group.slug)
                        }}
                        className={`ml-0.5 inline-flex h-4 w-4 items-center justify-center rounded transition ${
                          isActive ? 'opacity-70 hover:opacity-100' : 'hidden'
                        }`}
                        title="Copy link to this tab"
                      >
                        {copiedSlug === group.slug ? (
                          <Check className="h-3 w-3 text-emerald-400" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </span>
                    </button>
                  )
                })}
              </nav>
            )}

            {/* Link cards for the active tab */}
            <nav aria-label={`${displayTab(activeGroup?.label ?? 'Links')} links`} className="mt-6 grid w-full gap-3">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeSlug}
                  variants={containerVariants}
                  initial="hidden"
                  animate="show"
                  exit={{ opacity: 0, y: -8, transition: { duration: 0.15 } }}
                  className="grid w-full gap-3"
                >
                  {featuredLinks.map((link) => {
                    const Icon = bioIcon(link.icon)
                    return (
                      <motion.div
                        key={link.id}
                        variants={itemVariants}
                        className="group rounded-3xl border border-[#e4d7c4] bg-[#fffaf6] shadow-md shadow-[#2b2320]/[0.05]"
                      >
                        <div className="relative">
                          <LinkAnchor link={link} className="absolute inset-0" />
                          <div className="pointer-events-none aspect-[16/10] w-full overflow-hidden rounded-t-3xl bg-[#efe4d2]">
                            <img
                              src={link.thumbnail_url ?? ''}
                              alt=""
                              className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                              loading="lazy"
                            />
                          </div>
                        </div>
                        <div className="flex items-stretch border-t border-[#e4d7c4]">
                          <span className="pointer-events-none flex flex-1 items-center gap-2.5 px-4 py-3">
                            <Icon className="h-4 w-4 shrink-0 text-[#8a6a45]" />
                            <span className="truncate font-mono text-sm font-medium text-[#2b2320]">
                              {link.label}
                            </span>
                          </span>
                          <ShareTrigger
                            link={link}
                            isOpen={openMenu === link.id}
                            onToggle={() => setOpenMenu(openMenu === link.id ? null : link.id)}
                            onClose={() => setOpenMenu(null)}
                            menuRef={menuRef}
                            cornerClassName="rounded-br-3xl"
                          />
                        </div>
                      </motion.div>
                    )
                  })}

                  {standardLinks.map((link) => {
                    const Icon = bioIcon(link.icon)
                    return (
                      <motion.div
                        key={link.id}
                        variants={itemVariants}
                        className="flex items-stretch rounded-2xl border border-[#e4d7c4] bg-[#fffaf6]/90 shadow-sm shadow-[#2b2320]/[0.03] transition hover:-translate-y-0.5 hover:border-[#c98a4b] hover:shadow-md"
                      >
                        <div className="relative flex-1 overflow-hidden rounded-l-2xl">
                          <LinkAnchor link={link} className="absolute inset-0" />
                          <span className="pointer-events-none flex items-center justify-center gap-2.5 px-5 py-3.5">
                            <Icon className="h-4 w-4 shrink-0 text-[#8a6a45]" />
                            <span className="truncate font-mono text-sm font-medium text-[#2b2320]">
                              {link.label}
                            </span>
                          </span>
                        </div>
                        <ShareTrigger
                          link={link}
                          isOpen={openMenu === link.id}
                          onToggle={() => setOpenMenu(openMenu === link.id ? null : link.id)}
                          onClose={() => setOpenMenu(null)}
                          menuRef={menuRef}
                          cornerClassName="rounded-r-2xl"
                        />
                      </motion.div>
                    )
                  })}
                </motion.div>
              </AnimatePresence>

              {currentLinks.length === 0 && (
                <p className="rounded-2xl border border-dashed border-[#e4d7c4] px-4 py-6 text-center font-mono text-sm text-[#8a7a68]">
                  No links in this category yet.
                </p>
              )}
            </nav>
          </div>

          <footer className="mt-7 text-center font-mono text-xs text-[#8a7a68]">
            <a href="https://harun.dev" className="transition hover:text-[#b8541f]">
              harun.dev
            </a>
            <span className="mx-2 text-[#c9bba4]">·</span>
            <span>© {new Date().getFullYear()} Harun R. Rayhan</span>
          </footer>
        </motion.div>
      </main>
    </>
  )
}

// Override the default PublicLayout — Bio is standalone (no site nav/footer).
;(Bio as any).layout = (page: React.ReactNode) => page
