import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Mail } from 'lucide-react'
import { SubscribeForm, SubscribeTheme } from '@/Components/SubscribeForm'

const THEME = {
  warm: {
    backdrop: 'bg-[#2b2320]/80',
    panel: 'bg-[#fffaf6]',
    border: 'border-[#e4d7c4]',
    title: 'text-[#2b2320]',
    muted: 'text-[#8a6a45]',
    iconBg: 'bg-[#f1e6d3] text-[#b8541f]',
    close: 'text-[#8a6a45] hover:bg-[#f1e6d3] hover:text-[#2b2320]',
  },
  slate: {
    backdrop: 'bg-slate-950/80',
    panel: 'bg-white',
    border: 'border-slate-200',
    title: 'text-slate-950',
    muted: 'text-slate-500',
    iconBg: 'bg-slate-100 text-slate-700',
    close: 'text-slate-500 hover:bg-slate-100 hover:text-slate-950',
  },
} as const

export function SubscribePopup({
  open,
  onClose,
  source,
  theme = 'slate',
}: {
  open: boolean
  onClose: () => void
  source: string
  theme?: SubscribeTheme
}) {
  if (typeof document === 'undefined') return null
  const t = THEME[theme]

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="Subscribe"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className={`fixed inset-0 z-[100] flex items-center justify-center ${t.backdrop} p-6 backdrop-blur-sm`}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className={`relative w-full max-w-sm rounded-2xl border ${t.border} ${t.panel} p-6 shadow-2xl`}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className={`absolute right-3 top-3 rounded-full p-1.5 transition ${t.close}`}
            >
              <X className="h-4 w-4" />
            </button>

            <span className={`flex h-10 w-10 items-center justify-center rounded-full ${t.iconBg}`}>
              <Mail className="h-5 w-5" />
            </span>

            <h2 className={`mt-4 text-lg font-semibold ${t.title}`}>Get new posts and tools first</h2>
            <p className={`mt-1 text-sm ${t.muted}`}>
              I send an email when there's something worth reading. No spam, unsubscribe anytime.
            </p>

            <SubscribeForm source={source} theme={theme} onSuccess={onClose} className="mt-4" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
