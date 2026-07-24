import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Head, Link, usePage } from '@inertiajs/react'
import { motion, AnimatePresence, type Variants } from 'framer-motion'
import { getImageUrl } from '@/lib/imageUtils'
import { Share2 } from 'lucide-react'
import { bioIcon } from '@/lib/bioIcons'
import { ShareSheet } from '@/Components/ShareSheet'

interface BioLink {
  id: number
  label: string
  description: string | null
  url: string
  share_url: string
  icon: string
  thumbnail_url: string | null
  featured: boolean
  tab: string
  tab_slug: string
}

const isInternal = (url: string) => url.startsWith('/')
const isMailto = (url: string) => url.startsWith('mailto:') || url.startsWith('tel:')

/** External-site favicon URL via Google's favicon service, or null when the
 *  link has no real domain to fetch one for (internal routes, mailto/tel). */
const faviconUrl = (url: string): string | null => {
  if (isInternal(url) || isMailto(url)) return null
  try {
    return `https://www.google.com/s2/favicons?sz=64&domain=${new URL(url).hostname}`
  } catch {
    return null
  }
}

/** Tidy tab value for display — "default" becomes "Links". */
const displayTab = (tab: string): string => (tab === 'default' ? 'Links' : tab)

const SOCIAL_ICONS = [
  'instagram',
  'tiktok',
  'youtube',
  'facebook',
  'threads',
  'github',
  'linkedin',
  'twitter',
  'mail',
  'globe',
]

// Website and email always render last in the social icon row, in this order,
// regardless of where they fall in the underlying links data.
const SOCIAL_TRAILING = ['globe', 'mail']

// Tabs that always render in this fixed order, even before they have links.
// A declared tab with no links shows a "Coming soon" panel instead of hiding.
const DECLARED_TABS = [
  { slug: 'products', label: 'Products' },
  { slug: 'ai-tools', label: 'AI Tools' },
]

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
  // The card that hosts this anchor clips overflow, so a negative outline
  // offset keeps the keyboard-focus ring visible instead of getting clipped.
  const focusClassName = `${className} focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#b8541f]`

  if (internal) {
    return (
      <Link href={link.url} onClick={() => trackClick(link.id)} className={focusClassName} aria-label={link.label} />
    )
  }

  return (
    <a
      href={link.share_url}
      target={mailish ? undefined : '_blank'}
      rel={mailish ? undefined : 'noopener noreferrer'}
      onClick={() => trackClick(link.id)}
      className={focusClassName}
      aria-label={link.label}
    />
  )
}

/** Renders a link's real favicon when available, falling back to its
 *  registry icon (`bioIcon`) if the domain has none or it fails to load. */
function LinkFavicon({ link, className }: { link: BioLink; className: string }) {
  const [failed, setFailed] = useState(false)
  const favicon = faviconUrl(link.url)
  const Icon = bioIcon(link.icon)

  if (!favicon || failed) return <Icon className={className} />

  return <img src={favicon} alt="" className={`${className} rounded-[3px] object-contain`} onError={() => setFailed(true)} />
}

/** Real product logos, keyed by link URL — mirrors resources/js/Pages/Products.tsx.
 *  Served as plain public assets rather than the thumbnail_path/storage disk so
 *  they're available immediately on deploy, no admin upload or migration needed. */
const PRODUCT_LOGOS: Record<string, string> = {
  'https://toolblip.com': '/images/products/toolblip.svg',
  'https://ploy.cloud': '/images/products/ploycloud-icon.svg',
  'https://crontinel.com': '/images/products/crontinel.png',
  'https://appnary.com': '/images/products/appnary.svg',
  'https://amazingplugins.com': '/images/products/amazingplugins.jpg',
}

/** Standard-row icon: a product's real logo in a bordered box when it has
 *  one, otherwise the small favicon/registry icon. */
function LinkIcon({ link }: { link: BioLink }) {
  const logo = PRODUCT_LOGOS[link.url]
  if (logo) {
    return (
      <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#e4d7c4] bg-white sm:h-12 sm:w-12">
        <img src={logo} alt="" className="h-7 w-7 object-contain sm:h-8 sm:w-8" />
      </span>
    )
  }

  return <LinkFavicon link={link} className="h-4 w-4 shrink-0 text-[#8a6a45]" />
}

/** The per-link share trigger (share icon button) plus its ShareSheet, self-contained. */
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
        className={`flex h-full w-11 shrink-0 items-center justify-center border-l border-[#e4d7c4]/70 text-[#8a6a45] transition hover:bg-[#f1e6d3] hover:text-[#2b2320] focus-visible:bg-[#f1e6d3] focus-visible:text-[#2b2320] focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#b8541f] ${cornerClassName}`}
      >
        <Share2 className="h-4 w-4" />
      </button>
      {isOpen && (
        <div className="absolute right-0 top-full z-30 mt-2">
          <ShareSheet title={link.label} url={link.share_url} shareTitle={link.label} onClose={onClose} />
        </div>
      )}
    </div>
  )
}

export default function Bio({
  links = [],
  page_share_url: pageShareUrl,
  tab_share_urls: tabShareUrls = {},
}: {
  links?: BioLink[]
  page_share_url?: string
  tab_share_urls?: Record<string, string>
}) {
  const { url } = usePage()
  // Real page URL — feeds SEO tags (og:url, canonical). Must stay the actual
  // page, never the shortener redirect.
  const canonicalUrl = typeof window !== 'undefined' ? window.location.href : 'https://harun.dev/bio'
  // Shortened page URL for the "Share link" sheet's QR/copy/social links.
  const pageShareLinkUrl = pageShareUrl ?? canonicalUrl
  // og:image/twitter:image need a fully-qualified URL. getImageUrl() already
  // returns an absolute CDN URL in production; fall back to the canonical
  // domain everywhere else so link previews still resolve.
  const bioOgImagePath = getImageUrl('/images/og/bio.jpg')
  const ogImageUrl = bioOgImagePath.startsWith('http') ? bioOgImagePath : `https://harun.dev${bioOgImagePath}`

  // Separate social (icon-only row) from regular (tabbed) links. Website and
  // email are pulled out and appended last, in a fixed order, regardless of
  // where they land in the raw data.
  const socialLinksRaw = links.filter((l) => SOCIAL_ICONS.includes(l.icon))
  const socialLinks = [
    ...socialLinksRaw.filter((l) => !SOCIAL_TRAILING.includes(l.icon)),
    ...SOCIAL_TRAILING.flatMap((icon) => socialLinksRaw.filter((l) => l.icon === icon)),
  ]
  const regularLinks = links.filter((l) => !SOCIAL_ICONS.includes(l.icon))

  // Group regular links by tab slug, preserving insertion order
  interface TabGroup {
    slug: string
    label: string
    links: BioLink[]
  }
  const tabGroups: TabGroup[] = []
  const tabMap = new Map<string, TabGroup>()
  // Seed the always-visible declared tabs first (empty until links land),
  // so e.g. "AI Tools" shows a "Coming soon" panel instead of disappearing.
  for (const declared of DECLARED_TABS) {
    const group: TabGroup = { slug: declared.slug, label: declared.label, links: [] }
    tabMap.set(declared.slug, group)
    tabGroups.push(group)
  }
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
  const [openMenu, setOpenMenu] = useState<number | 'page' | `tab:${string}` | null>(null)
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

  // Paint the root canvas cream to match this page. iOS Safari uses the
  // <html> background to fill the overscroll/toolbar-collapse region, and the
  // app default (set in app.css) is slate to match PublicLayout — without
  // this override that region flashes slate instead of Bio's cream.
  useEffect(() => {
    const root = document.documentElement
    root.style.backgroundColor = '#f7f1e8'
    return () => {
      root.style.backgroundColor = ''
    }
  }, [])

  const tabShareUrl = useCallback(
    (slug: string) => {
      if (tabShareUrls[slug]) return tabShareUrls[slug]
      const base = window.location.origin + window.location.pathname
      return slug === tabGroups[0]?.slug ? base : `${base}?tab=${encodeURIComponent(slug)}`
    },
    [tabGroups, tabShareUrls],
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
        <meta property="og:image" content={ogImageUrl} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Harun Ray | Bio" />
        <meta
          name="twitter:description"
          content="Quick links to Harun R. Rayhan's portfolio, blog, contact details, and social profiles."
        />
        <meta name="twitter:image" content={ogImageUrl} />
        <link rel="canonical" href={canonicalUrl} />
      </Head>

      <main className="relative min-h-svh overflow-hidden bg-[#f7f1e8] px-4 py-10 text-[#2b2320] sm:px-6 sm:py-14 lg:px-8">
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
          className="relative mx-auto flex min-h-[calc(100svh-6rem)] w-full max-w-xl flex-col items-center pt-12"
        >
          {/* Whole-page share button */}
          <div className="absolute right-0 top-0" ref={openMenu === 'page' ? menuRef : null}>
            <button
              type="button"
              onClick={() => setOpenMenu(openMenu === 'page' ? null : 'page')}
              aria-label="Share this page"
              aria-haspopup="menu"
              aria-expanded={openMenu === 'page'}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[#e4d7c4] bg-[#fffaf6]/90 text-[#5b4a3a] shadow-sm backdrop-blur transition hover:border-[#c98a4b] hover:text-[#2b2320] focus-visible:border-[#c98a4b] focus-visible:text-[#2b2320] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b8541f]"
            >
              <Share2 className="h-4 w-4" />
            </button>
            {openMenu === 'page' && (
              <div className="absolute right-0 top-full z-30 mt-2">
                <ShareSheet title="Harun R. Rayhan" url={pageShareLinkUrl} shareTitle="Harun R. Rayhan" onClose={() => setOpenMenu(null)} />
              </div>
            )}
          </div>

          <div className="flex w-full flex-col items-center text-center">
            <div className="relative">
              <div className="absolute inset-0 -z-10 scale-110 rounded-full bg-gradient-to-br from-[#e8b374] to-[#b8541f] opacity-40 blur-xl" />
              <img
                src={getImageUrl('/images/profile/harun-bio.jpg')}
                alt="Harun R. Rayhan"
                className="h-32 w-32 rounded-full border-4 border-[#fffaf6] object-cover shadow-lg shadow-[#2b2320]/10 sm:h-36 sm:w-36"
                loading="eager"
                width={144}
                height={144}
              />
            </div>

            <div className="mt-5 space-y-1.5">
              <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.32em] text-[#b8541f]">
                Harun.dev bio
              </p>
              <h1 className="font-display text-3xl font-semibold tracking-tight text-[#2b2320] sm:text-4xl">
                Harun R. Rayhan
              </h1>
              <p className="font-mono text-sm font-semibold text-[#3a2f27] sm:text-base">
                Software Engineer turning Entrepreneur
              </p>
              <p className="font-mono text-xs text-[#6b5d4f] sm:text-sm">
                DevOps · AI / ML · AWS · CloudOps · Infrastructure Automation
              </p>
            </div>

            {/* Monochrome social icon row — wraps and centers at every width
                so it never gets clipped by main's overflow-hidden. */}
            {socialLinks.length > 0 && (
              <div className="mt-5 flex w-full flex-wrap items-center justify-center gap-1">
                {socialLinks.map((link) => {
                  const Icon = bioIcon(link.icon)
                  return (
                    <a
                      key={link.id}
                      href={link.share_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => trackClick(link.id)}
                      aria-label={link.label}
                      className="group relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-[#4a3b2e] transition hover:-translate-y-0.5 hover:text-[#b8541f] focus-visible:-translate-y-0.5 focus-visible:text-[#b8541f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b8541f] sm:h-12 sm:w-12"
                    >
                      <Icon className="h-[26px] w-[26px] sm:h-[22px] sm:w-[22px]" />
                      <span
                        role="tooltip"
                        className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-[#2b2320] px-2 py-1 font-mono text-[10px] font-medium text-[#f7f1e8] opacity-0 shadow-md transition-opacity duration-150 [@media(hover:hover)]:group-hover:opacity-100 group-focus-visible:opacity-100"
                      >
                        {link.label}
                      </span>
                    </a>
                  )
                })}
              </div>
            )}

            {/* Tab navigation */}
            {tabGroups.length > 1 && (
              <div className="relative mt-7 w-full" ref={typeof openMenu === 'string' && openMenu.startsWith('tab:') ? menuRef : null}>
                <nav
                  aria-label="Link categories"
                  className="flex w-full gap-1 overflow-x-auto rounded-full border border-[#e4d7c4] bg-[#fffaf6]/70 p-1"
                >
                  {tabGroups.map((group) => {
                    const isActive = group.slug === activeSlug
                    const shareId = `tab:${group.slug}` as const
                    return (
                      <div
                        key={group.slug}
                        className={`relative flex flex-1 items-center justify-center whitespace-nowrap rounded-full font-mono text-xs font-medium uppercase tracking-wider transition sm:text-[13px] ${
                          isActive
                            ? 'bg-[#2b2320] text-[#f7f1e8] shadow-sm'
                            : 'text-[#6b5d4f] hover:bg-[#f1e6d3] hover:text-[#2b2320]'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => setActiveSlug(group.slug)}
                          aria-pressed={isActive}
                          className="flex-1 rounded-full px-3.5 py-2 uppercase tracking-wider focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b8541f]"
                        >
                          {displayTab(group.label)}
                        </button>

                        {/* Share button (visible on the active tab, a sibling
                            of the select button so this isn't an interactive
                            control nested inside another one). */}
                        {isActive && (
                          <button
                            type="button"
                            onClick={() => setOpenMenu(openMenu === shareId ? null : shareId)}
                            aria-label={`Share ${displayTab(group.label)}`}
                            aria-haspopup="menu"
                            aria-expanded={openMenu === shareId}
                            title={`Share ${displayTab(group.label)}`}
                            className="mr-2 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded opacity-70 transition hover:opacity-100 focus-visible:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b8541f] sm:h-4 sm:w-4"
                          >
                            <Share2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    )
                  })}
                </nav>

                {typeof openMenu === 'string' &&
                  openMenu.startsWith('tab:') &&
                  (() => {
                    const openSlug = openMenu.slice(4)
                    const idx = tabGroups.findIndex((g) => g.slug === openSlug)
                    const centerPct = tabGroups.length > 0 ? ((idx + 0.5) / tabGroups.length) * 100 : 50
                    return (
                      <>
                        {/* Caret pins to the exact tab center so it's obvious which
                            tab this popup belongs to, independent of where the
                            sheet itself gets clamped on narrow screens. */}
                        <span
                          aria-hidden="true"
                          className="absolute top-full z-30 mt-[7px] h-3 w-3 rotate-45 rounded-[2px] border-l border-t border-[#e4d7c4] bg-[#fffaf6]"
                          style={{ left: `${centerPct}%`, transform: 'translateX(-50%)' }}
                        />
                        <div
                          className="absolute top-full z-30 mt-2"
                          style={{ left: `clamp(9rem, ${centerPct}%, calc(100% - 9rem))`, transform: 'translateX(-50%)' }}
                        >
                          <ShareSheet
                            title={displayTab(tabMap.get(openSlug)?.label ?? '')}
                            url={tabShareUrl(openSlug)}
                            shareTitle="Harun R. Rayhan"
                            onClose={() => setOpenMenu(null)}
                          />
                        </div>
                      </>
                    )
                  })()}
              </div>
            )}

            {/* Link cards for the active tab */}
            <nav aria-label={`${displayTab(activeGroup?.label ?? 'Links')} links`} className="mt-6 grid w-full grid-cols-1 gap-3">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeSlug}
                  variants={containerVariants}
                  initial="hidden"
                  animate="show"
                  exit={{ opacity: 0, y: -8, transition: { duration: 0.15 } }}
                  className="grid w-full grid-cols-1 gap-3"
                >
                  {featuredLinks.map((link) => {
                    return (
                      <motion.div
                        key={link.id}
                        variants={itemVariants}
                        className={`group rounded-3xl border border-[#e4d7c4] bg-[#fffaf6] shadow-md shadow-[#2b2320]/[0.05] ${
                          openMenu === link.id ? 'relative z-30' : ''
                        }`}
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
                            <LinkFavicon link={link} className="h-4 w-4 shrink-0 text-[#8a6a45]" />
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
                    return (
                      <motion.div
                        key={link.id}
                        variants={itemVariants}
                        className={`flex items-stretch rounded-2xl border border-[#e4d7c4] bg-[#fffaf6]/90 shadow-sm shadow-[#2b2320]/[0.03] transition hover:-translate-y-0.5 hover:border-[#c98a4b] hover:shadow-md ${
                          openMenu === link.id ? 'relative z-30' : ''
                        }`}
                      >
                        <div className="relative flex-1 overflow-hidden rounded-l-2xl">
                          <LinkAnchor link={link} className="absolute inset-0" />
                          <span
                            className={`pointer-events-none flex items-center gap-2.5 px-5 py-3.5 ${
                              link.description ? '' : 'justify-center'
                            }`}
                          >
                            <LinkIcon link={link} />
                            {link.description ? (
                              <span className="min-w-0 flex-1 text-left">
                                <span className="block truncate font-mono text-sm font-medium text-[#2b2320]">
                                  {link.label}
                                </span>
                                <span className="block truncate text-xs text-[#6b5d4f]">
                                  {link.description}
                                </span>
                              </span>
                            ) : (
                              <span className="truncate font-mono text-sm font-medium text-[#2b2320]">
                                {link.label}
                              </span>
                            )}
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
                <p className="rounded-2xl border border-dashed border-[#e4d7c4] px-4 py-6 text-center font-mono text-sm text-[#6b5d4f]">
                  Coming soon.
                </p>
              )}
            </nav>
          </div>

          <footer className="mt-10 space-y-3 pb-6 text-center font-mono text-xs text-[#6b5d4f]">
            <p className="mx-auto max-w-xs">
              Thanks for stopping by. New tools and posts land here first.
            </p>
            <p>
              <a href="https://harun.dev" className="transition hover:text-[#b8541f]">
                harun.dev
              </a>
              <span className="mx-2 text-[#c9bba4]">·</span>
              <span>© {new Date().getFullYear()} Harun R. Rayhan</span>
            </p>
          </footer>
        </motion.div>
      </main>
    </>
  )
}

// Override the default PublicLayout — Bio is standalone (no site nav/footer).
;(Bio as any).layout = (page: React.ReactNode) => page
