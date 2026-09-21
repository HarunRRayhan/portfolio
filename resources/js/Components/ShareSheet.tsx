import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { QRCodeSVG } from 'qrcode.react'
import { Check, Copy, Maximize2, Minimize2, Share, X } from 'lucide-react'
import { SOCIAL_SHARE } from '@/lib/shareTargets'

export type ShareSheetTheme = 'warm' | 'slate'

// Keep the content neutral while letting the sheet inherit the visual language
// of the page it appears on.
const THEME = {
  warm: {
    font: 'font-mono',
    border: 'border-[#e4d7c4]',
    panelBg: 'bg-[#fffaf6]',
    panelShadow: 'shadow-[#2b2320]/15',
    label: 'text-[#2b2320]',
    muted: 'text-[#8a6a45]',
    surface: 'bg-[#f7f1e8]',
    surfaceBorder: 'border-[#eadbc7]',
    mutedHoverBg: 'hover:bg-[#f1e6d3]',
    mutedHoverText: 'hover:text-[#2b2320]',
    actionHover: 'hover:border-[#c98a4b] hover:bg-[#f1e6d3]',
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
    panelShadow: 'shadow-slate-950/15',
    label: 'text-slate-950',
    muted: 'text-slate-500',
    surface: 'bg-slate-50',
    surfaceBorder: 'border-slate-200',
    mutedHoverBg: 'hover:bg-slate-100',
    mutedHoverText: 'hover:text-slate-950',
    actionHover: 'hover:border-slate-300 hover:bg-slate-100',
    qrHoverBorder: 'hover:border-slate-400',
    modalBackdrop: 'bg-slate-950/80',
    qrFg: '#0f172a',
    copyBg: 'bg-slate-900 text-white',
    focusRing: 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-500',
  },
} as const

/** Shared share UI with a clear QR/copy path and a responsive social grid. */
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
  const copiedTimer = useRef<number | null>(null)
  const titleId = useId()
  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function'

  useEffect(() => {
    return () => {
      if (copiedTimer.current !== null) window.clearTimeout(copiedTimer.current)
    }
  }, [])

  useEffect(() => {
    if (!expanded) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setExpanded(false)
    }
    const previousOverflow = document.body.style.overflow

    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', onKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [expanded])

  const copy = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url)
      } else {
        const textarea = document.createElement('textarea')
        textarea.value = url
        textarea.setAttribute('readonly', '')
        textarea.style.position = 'fixed'
        textarea.style.opacity = '0'
        document.body.appendChild(textarea)
        textarea.select()
        const copiedWithFallback = document.execCommand('copy')
        textarea.remove()
        if (!copiedWithFallback) return
      }

      setCopied(true)
      if (copiedTimer.current !== null) window.clearTimeout(copiedTimer.current)
      copiedTimer.current = window.setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard access can be denied by the browser. The link remains
      // visible in the sheet so it can still be selected or scanned.
    }
  }

  const share = async () => {
    try {
      await navigator.share({ title: shareTitle, url })
      onClose()
    } catch {
      // Dismissing the native share dialog is not an error.
    }
  }

  const renderHeader = (variant: 'sheet' | 'modal') => {
    const headingId = `${titleId}-${variant}`

    return (
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${t.copyBg}`}>
            <Share className="h-4 w-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className={`truncate ${t.font} text-[10px] font-semibold uppercase tracking-[0.16em] ${t.muted}`}>{kicker}</p>
            <p id={headingId} className={`mt-0.5 break-words ${t.font} ${variant === 'modal' ? 'text-base' : 'text-sm'} font-semibold ${t.label}`}>
              {title}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {variant === 'modal' ? (
            <button
              type="button"
              onClick={() => setExpanded(false)}
              aria-label="Back to share options"
              className={`rounded-full p-2 ${t.muted} transition ${t.mutedHoverBg} ${t.mutedHoverText} ${t.focusRing}`}
            >
              <Minimize2 className="h-4 w-4" />
            </button>
          ) : null}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close share sheet"
            className={`rounded-full p-2 ${t.muted} transition ${t.mutedHoverBg} ${t.mutedHoverText} ${t.focusRing}`}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    )
  }

  const renderQuickActions = (variant: 'sheet' | 'modal') => (
    <div className={`mt-3 grid gap-2 ${canShare ? 'grid-cols-2' : 'grid-cols-1'}`}>
      <button
        type="button"
        onClick={copy}
        aria-label={copied ? 'Link copied' : 'Copy link'}
        className={`flex min-h-11 items-center justify-center gap-2 rounded-xl border ${t.border} px-3 text-xs font-semibold transition ${t.actionHover} ${t.focusRing}`}
      >
        <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${copied ? 'bg-emerald-500 text-white' : t.copyBg}`}>
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        </span>
        <span>{copied ? 'Copied' : 'Copy link'}</span>
      </button>

      {canShare ? (
        <button
          type="button"
          onClick={share}
          className={`flex min-h-11 items-center justify-center gap-2 rounded-xl border ${t.border} ${t.surface} px-3 text-xs font-semibold ${t.label} transition ${t.actionHover} ${t.focusRing}`}
        >
          <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${t.surface} ${t.muted}`}>
            <Share className="h-3.5 w-3.5" />
          </span>
          <span>{variant === 'modal' ? 'More options' : 'More'}</span>
        </button>
      ) : null}
    </div>
  )

  const renderSocialShare = (variant: 'sheet' | 'modal') => (
    <div className={`mt-5 border-t ${t.surfaceBorder} pt-4`}>
      <p className={`${t.font} text-[10px] font-semibold uppercase tracking-[0.16em] ${t.muted}`}>Share via</p>
      <div className={`mt-3 grid grid-cols-4 gap-2 ${variant === 'modal' ? 'sm:grid-cols-5' : ''}`}>
        {SOCIAL_SHARE.map(({ name, label, Icon, href, bg, fg }) => (
          <button
            key={name}
            type="button"
            onClick={() => window.open(href(url, shareTitle), '_blank', 'noopener,noreferrer')}
            aria-label={label ?? `Share on ${name}`}
            title={name}
            className={`group flex min-h-[4.25rem] min-w-0 flex-col items-center justify-center gap-1 rounded-xl border ${t.surfaceBorder} ${t.surface} px-1 py-2 transition ${t.actionHover} ${t.focusRing}`}
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full transition-transform duration-200 group-hover:scale-105" style={{ background: bg, color: fg }}>
              <Icon className="h-4 w-4" />
            </span>
            <span className={`${t.font} max-w-full truncate text-[10px] font-medium leading-3 ${t.muted}`}>{name}</span>
          </button>
        ))}
      </div>
    </div>
  )

  const renderQrCard = () => (
    <div className={`mt-4 flex items-center gap-3 rounded-2xl border ${t.surfaceBorder} ${t.surface} p-3 sm:gap-4 sm:p-4`}>
      <button
        type="button"
        onClick={() => setExpanded(true)}
        aria-label="Enlarge QR code"
        className={`group relative shrink-0 rounded-xl border ${t.surfaceBorder} bg-white p-2 transition ${t.qrHoverBorder} ${t.focusRing}`}
      >
        <QRCodeSVG value={url} size={112} bgColor="#ffffff" fgColor={t.qrFg} level="M" />
        <span className="absolute bottom-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-lg bg-white/95 text-slate-600 opacity-0 shadow-sm transition group-hover:opacity-100 group-focus-visible:opacity-100">
          <Maximize2 className="h-3 w-3" />
        </span>
      </button>
      <div className="min-w-0">
        <p className={`${t.font} text-[10px] font-semibold uppercase tracking-[0.16em] ${t.muted}`}>Scan to open</p>
        <p className={`mt-1 text-xs leading-5 ${t.label}`}>Use your camera, or share this short link.</p>
        <p title={url} className={`mt-2 truncate ${t.font} text-[11px] ${t.muted}`}>{url}</p>
      </div>
    </div>
  )

  return (
    <div
      role="dialog"
      aria-labelledby={`${titleId}-sheet`}
      className={`w-[min(22rem,calc(100vw-2rem))] max-w-full max-h-[calc(100dvh-1.5rem)] overflow-y-auto overscroll-contain rounded-2xl border ${t.border} ${t.panelBg} p-4 text-left shadow-xl ${t.panelShadow} sm:p-5`}
      onMouseDown={(event) => event.stopPropagation()}
    >
      {renderHeader('sheet')}
      {renderQrCard()}
      {renderQuickActions('sheet')}
      {renderSocialShare('sheet')}

      {expanded &&
        typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            <motion.div
              key="share-qr-dialog"
              role="presentation"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className={`fixed inset-0 z-[100] flex items-center justify-center ${t.modalBackdrop} p-4 backdrop-blur-sm sm:p-6`}
              onMouseDown={(event) => event.stopPropagation()}
              onClick={(event) => {
                if (event.target === event.currentTarget) setExpanded(false)
              }}
            >
              <motion.div
                role="dialog"
                aria-modal="true"
                aria-labelledby={`${titleId}-modal`}
                initial={{ opacity: 0, scale: 0.96, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 8 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className={`relative max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto rounded-2xl border ${t.border} ${t.panelBg} p-5 shadow-2xl sm:p-6`}
                onClick={(event) => event.stopPropagation()}
              >
                {renderHeader('modal')}
                <div className={`mt-5 flex justify-center rounded-2xl border ${t.surfaceBorder} bg-white p-4 sm:p-6`}>
                  <QRCodeSVG
                    value={url}
                    size={512}
                    bgColor="#ffffff"
                    fgColor={t.qrFg}
                    level="M"
                    className="h-auto w-full max-w-[22rem]"
                  />
                </div>
                <p className={`mt-3 text-center ${t.font} text-[11px] ${t.muted}`}>Scan to open this link</p>
                {renderQuickActions('modal')}
                {renderSocialShare('modal')}
              </motion.div>
            </motion.div>
          </AnimatePresence>,
          document.body,
        )}
    </div>
  )
}
