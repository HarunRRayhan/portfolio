import { useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { QRCodeSVG } from 'qrcode.react'
import { Check, Copy, Maximize2, Minimize2, Share, X } from 'lucide-react'
import { SOCIAL_SHARE } from '@/lib/shareTargets'

export type ShareSheetTheme = 'warm' | 'slate'

// Palette tokens per theme — 'warm' matches the bio page's cream/amber look,
// 'slate' matches the blog pages' monochrome slate-and-white look.
const THEME = {
  warm: {
    font: 'font-mono',
    border: 'border-[#e4d7c4]',
    panelBg: 'bg-[#fffaf6]',
    panelShadow: 'shadow-[#2b2320]/10',
    label: 'text-[#5b4a3a]',
    muted: 'text-[#8a6a45]',
    mutedHoverBg: 'hover:bg-[#f1e6d3]',
    mutedHoverText: 'hover:text-[#2b2320]',
    qrHoverBorder: 'hover:border-[#c98a4b]',
    modalBackdrop: 'bg-[#2b2320]/80',
    qrFg: '#2b2320',
    copyBg: 'bg-[#2b2320] text-[#fdf8f2]',
    focusRing: 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b8541f]',
  },
  slate: {
    font: '',
    border: 'border-slate-200',
    panelBg: 'bg-white',
    panelShadow: 'shadow-slate-950/10',
    label: 'text-slate-600',
    muted: 'text-slate-500',
    mutedHoverBg: 'hover:bg-slate-100',
    mutedHoverText: 'hover:text-slate-950',
    qrHoverBorder: 'hover:border-slate-400',
    modalBackdrop: 'bg-slate-950/80',
    qrFg: '#0f172a',
    copyBg: 'bg-slate-900 text-white',
    focusRing: 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-500',
  },
} as const

/** Shared share-sheet UI (native share, copy-link, and a scannable QR code).
 *  Renders unpositioned — the caller wraps it in its own positioned container.
 *  Tapping the QR (or Expand) swaps to a full-screen overlay with the same
 *  content at a larger size; Collapse returns to this inline view in place,
 *  Close dismisses the sheet everywhere. */
export function ShareSheet({
  title,
  kicker = 'Share link',
  url,
  shareTitle,
  onClose,
  theme = 'warm',
}: {
  title: string
  kicker?: string
  url: string
  shareTitle: string
  onClose: () => void
  theme?: ShareSheetTheme
}) {
  const t = THEME[theme]
  const [copied, setCopied] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function'

  const copy = () => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const share = () => {
    navigator.share({ title: shareTitle, url }).catch(() => {})
  }

  // Intent URLs are opened via `window.open` at click time rather than a
  // static `href` — ad blockers' cosmetic filter lists (e.g. Fanboy's Social
  // Blocking List) match and hide anchors whose `href` attribute contains
  // known share-intent hosts like facebook.com/sharer or twitter.com/intent.
  // Copy-link and native-share ("More") are folded in as the first/last
  // tiles so the whole row acts like a native OS share sheet.
  //
  // Tile size in the inline dropdown is deliberately wider than the panel can
  // fit in one go — the row is meant to end mid-tile so it reads as
  // scrollable at a glance instead of looking like a complete, static row.
  // The expanded pop-up is fixed larger still, with room to spare at `max-w-md`.
  const TILE = {
    sheet: { wrap: 'w-16', circle: 'h-12 w-12', icon: 'h-5 w-5', iconSm: 'h-4 w-4', label: 'text-[10px]', gap: 'gap-2' },
    modal: { wrap: 'w-16', circle: 'h-14 w-14', icon: 'h-6 w-6', iconSm: 'h-5 w-5', label: 'text-[11px]', gap: 'gap-3' },
  } as const

  const renderSocialShare = (variant: keyof typeof TILE) => {
    const s = TILE[variant]
    const fade =
      variant === 'sheet'
        ? '[mask-image:linear-gradient(to_right,black_82%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_right,black_82%,transparent_100%)]'
        : ''
    return (
      <div className={`mt-3 flex ${s.gap} overflow-x-auto py-1 ${fade}`}>
        <button
          type="button"
          onClick={copy}
          className={`flex ${s.wrap} shrink-0 flex-col items-center gap-1.5 rounded-xl py-1 ${t.focusRing}`}
        >
          <span
            className={`flex ${s.circle} items-center justify-center rounded-full transition-all duration-300 ${
              copied ? 'scale-105 bg-emerald-500 text-white' : `${t.copyBg} hover:scale-105 active:scale-95`
            }`}
          >
            {copied ? <Check className={s.iconSm} /> : <Copy className={s.iconSm} />}
          </span>
          <span className={`${t.font} ${s.label} font-medium ${t.muted}`}>{copied ? 'Copied' : 'Copy link'}</span>
        </button>

        {SOCIAL_SHARE.map(({ name, label, Icon, href, bg, fg }) => (
          <button
            key={name}
            type="button"
            onClick={() => window.open(href(url, shareTitle), '_blank', 'noopener,noreferrer')}
            aria-label={label ?? `Share on ${name}`}
            className={`flex ${s.wrap} shrink-0 flex-col items-center gap-1.5 rounded-xl py-1 ${t.focusRing}`}
          >
            <span className={`flex ${s.circle} items-center justify-center rounded-full`} style={{ background: bg, color: fg }}>
              <Icon className={s.icon} />
            </span>
            <span className={`${t.font} ${s.label} font-medium ${t.muted}`}>{name}</span>
          </button>
        ))}

        {canShare && (
          <button
            type="button"
            onClick={share}
            className={`flex ${s.wrap} shrink-0 flex-col items-center gap-1.5 rounded-xl py-1 ${t.focusRing}`}
          >
            <span className={`flex ${s.circle} items-center justify-center rounded-full bg-slate-100 text-slate-700`}>
              <Share className={s.iconSm} />
            </span>
            <span className={`${t.font} ${s.label} font-medium ${t.muted}`}>More</span>
          </button>
        )}
      </div>
    )
  }

  return (
    <div role="menu" className={`w-72 max-w-[calc(100vw-2rem)] rounded-2xl border ${t.border} ${t.panelBg} p-4 text-left shadow-xl ${t.panelShadow}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className={`truncate ${t.font} text-[10px] font-semibold uppercase tracking-wider ${t.muted}`}>{kicker}</p>
          <p className={`truncate ${t.font} text-sm font-semibold ${t.label}`}>{title}</p>
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          <button
            type="button"
            onClick={() => setExpanded(true)}
            aria-label="Expand"
            className={`rounded-full p-1 ${t.muted} transition ${t.mutedHoverBg} ${t.mutedHoverText} ${t.focusRing}`}
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className={`rounded-full p-1 ${t.muted} transition ${t.mutedHoverBg} ${t.mutedHoverText} ${t.focusRing}`}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setExpanded(true)}
        aria-label="Enlarge QR code"
        className={`mt-3 flex w-full justify-center rounded-xl border ${t.border} bg-white p-3 transition ${t.qrHoverBorder} ${t.focusRing}`}
      >
        <QRCodeSVG value={url} size={144} bgColor="#ffffff" fgColor={t.qrFg} level="M" />
      </button>

      {renderSocialShare('sheet')}

      {expanded &&
        typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label={`${title} share sheet`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className={`fixed inset-0 z-[100] flex items-center justify-center ${t.modalBackdrop} p-6 backdrop-blur-sm`}
              onClick={() => setExpanded(false)}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className={`truncate ${t.font} text-[10px] font-semibold uppercase tracking-wider ${t.muted}`}>{kicker}</p>
                    <p className={`truncate ${t.font} text-base font-semibold ${t.label}`}>{title}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-0.5">
                    <button
                      type="button"
                      onClick={() => setExpanded(false)}
                      aria-label="Collapse"
                      className={`rounded-full p-1.5 ${t.muted} transition ${t.mutedHoverBg} ${t.mutedHoverText} ${t.focusRing}`}
                    >
                      <Minimize2 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={onClose}
                      aria-label="Close"
                      className={`rounded-full p-1.5 ${t.muted} transition ${t.mutedHoverBg} ${t.mutedHoverText} ${t.focusRing}`}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className={`mt-4 flex justify-center rounded-xl border ${t.border} bg-white p-3`}>
                  <QRCodeSVG
                    value={url}
                    size={512}
                    bgColor="#ffffff"
                    fgColor={t.qrFg}
                    level="M"
                    className="h-auto w-full max-w-[360px]"
                  />
                </div>

                {renderSocialShare('modal')}
              </motion.div>
            </motion.div>
          </AnimatePresence>,
          document.body,
        )}
    </div>
  )
}
