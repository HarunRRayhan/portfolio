import { useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { QRCodeSVG } from 'qrcode.react'
import { Check, Copy, Maximize2, Minimize2, Share2, X } from 'lucide-react'
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
    action: 'text-[#3a2f27]',
    actionHoverBg: 'hover:bg-[#f1e6d3]',
    social: 'text-[#5b4a3a]',
    socialHoverBorder: 'hover:border-[#c98a4b]',
    socialHoverText: 'hover:text-[#b8541f]',
    qrHoverBorder: 'hover:border-[#c98a4b]',
    modalBackdrop: 'bg-[#2b2320]/80',
    qrFg: '#2b2320',
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
    action: 'text-slate-700',
    actionHoverBg: 'hover:bg-slate-100',
    social: 'text-slate-600',
    socialHoverBorder: 'hover:border-slate-400',
    socialHoverText: 'hover:text-slate-950',
    qrHoverBorder: 'hover:border-slate-400',
    modalBackdrop: 'bg-slate-950/80',
    qrFg: '#0f172a',
  },
} as const

/** Shared share-sheet UI (native share, copy-link, and a scannable QR code).
 *  Renders unpositioned — the caller wraps it in its own positioned container.
 *  Tapping the QR (or Expand) swaps to a full-screen overlay with the same
 *  content at a larger size; Collapse returns to this inline view in place,
 *  Close dismisses the sheet everywhere. */
export function ShareSheet({
  title,
  url,
  shareTitle,
  onClose,
  theme = 'warm',
}: {
  title: string
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

  const renderActions = () => (
    <div className="mt-3 flex gap-2">
      {canShare && (
        <button
          type="button"
          onClick={share}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg border ${t.border} bg-white px-3 py-2 ${t.font} text-xs font-medium ${t.action} transition ${t.actionHoverBg}`}
        >
          <Share2 className="h-3.5 w-3.5" /> Share
        </button>
      )}
      <button
        type="button"
        onClick={copy}
        className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg border ${t.border} bg-white px-3 py-2 ${t.font} text-xs font-medium ${t.action} transition ${t.actionHoverBg}`}
      >
        {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
        {copied ? 'Copied' : 'Copy link'}
      </button>
    </div>
  )

  // Intent URLs are opened via `window.open` at click time rather than a
  // static `href` — ad blockers' cosmetic filter lists (e.g. Fanboy's Social
  // Blocking List) match and hide anchors whose `href` attribute contains
  // known share-intent hosts like facebook.com/sharer or twitter.com/intent.
  const renderSocialShare = () => (
    <div className="mt-3 flex justify-center gap-2">
      {SOCIAL_SHARE.map(({ name, label, Icon, href }) => (
        <button
          key={name}
          type="button"
          onClick={() => window.open(href(url, shareTitle), '_blank', 'noopener,noreferrer')}
          aria-label={label ?? `Share on ${name}`}
          className={`flex h-9 w-9 items-center justify-center rounded-full border ${t.border} bg-white ${t.social} transition ${t.socialHoverBorder} ${t.socialHoverText}`}
        >
          <Icon className="h-4 w-4" />
        </button>
      ))}
    </div>
  )

  return (
    <div role="menu" className={`w-full rounded-2xl border ${t.border} ${t.panelBg} p-4 text-left shadow-xl sm:w-72 ${t.panelShadow}`}>
      <div className="flex items-center justify-between gap-2">
        <p className={`truncate ${t.font} text-xs font-semibold uppercase tracking-wider ${t.label}`}>{title}</p>
        <div className="flex shrink-0 items-center gap-0.5">
          <button
            type="button"
            onClick={() => setExpanded(true)}
            aria-label="Expand"
            className={`rounded-full p-1 ${t.muted} transition ${t.mutedHoverBg} ${t.mutedHoverText}`}
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className={`rounded-full p-1 ${t.muted} transition ${t.mutedHoverBg} ${t.mutedHoverText}`}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setExpanded(true)}
        aria-label="Enlarge QR code"
        className={`mt-3 flex w-full justify-center rounded-xl border ${t.border} bg-white p-3 transition ${t.qrHoverBorder}`}
      >
        <QRCodeSVG value={url} size={144} bgColor="#ffffff" fgColor={t.qrFg} level="M" />
      </button>

      {renderSocialShare()}
      {renderActions()}

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
                  <p className={`truncate ${t.font} text-xs font-semibold uppercase tracking-wider ${t.label}`}>{title}</p>
                  <div className="flex shrink-0 items-center gap-0.5">
                    <button
                      type="button"
                      onClick={() => setExpanded(false)}
                      aria-label="Collapse"
                      className={`rounded-full p-1.5 ${t.muted} transition ${t.mutedHoverBg} ${t.mutedHoverText}`}
                    >
                      <Minimize2 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={onClose}
                      aria-label="Close"
                      className={`rounded-full p-1.5 ${t.muted} transition ${t.mutedHoverBg} ${t.mutedHoverText}`}
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

                {renderSocialShare()}
                {renderActions()}
              </motion.div>
            </motion.div>
          </AnimatePresence>,
          document.body,
        )}
    </div>
  )
}
