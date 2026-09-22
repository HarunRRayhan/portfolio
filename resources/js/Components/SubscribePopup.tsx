import { useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence, type Variants } from 'framer-motion'
import { X, Mail, ShieldCheck } from 'lucide-react'
import { SubscribeForm, SubscribeTheme } from '@/Components/SubscribeForm'

const THEME = {
  warm: {
    backdrop: 'bg-[#2b2320]/70',
    panel: 'bg-[#fffaf6] border-[#e4d7c4]',
    // Soft amber wash bleeding down from the top edge. Echoes Bio's layered glow.
    glow: 'bg-[radial-gradient(120%_90%_at_50%_-10%,rgba(217,157,89,0.20),transparent_60%)]',
    iconTile: 'bg-gradient-to-br from-[#f6ecda] to-[#f0e2cd] text-[#b8541f] ring-1 ring-inset ring-[#e4d7c4]',
    iconGlow: 'from-[#e8b374] to-[#b8541f]',
    title: 'font-display font-semibold tracking-tight text-[#2b2320]',
    lead: 'text-[#6b5d4f]',
    fine: 'text-[#8a6a45]',
    fineIcon: 'text-[#b8541f]',
    proof: 'text-[#6b5d4f]',
    proofAvatarBorder: 'border-[#fffaf6]',
    close:
      'border-[#e4d7c4] text-[#8a6a45] hover:bg-[#f1e6d3] hover:text-[#2b2320] focus-visible:ring-[#b8541f]',
  },
  slate: {
    backdrop: 'bg-slate-950/70',
    panel: 'bg-white border-slate-200',
    glow: 'bg-[radial-gradient(120%_90%_at_50%_-10%,rgba(100,116,139,0.12),transparent_60%)]',
    iconTile: 'bg-gradient-to-br from-slate-50 to-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200',
    iconGlow: 'from-slate-300 to-slate-500',
    title: 'font-semibold tracking-tight text-slate-950',
    lead: 'text-slate-500',
    fine: 'text-slate-400',
    fineIcon: 'text-slate-400',
    proof: 'text-slate-500',
    proofAvatarBorder: 'border-white',
    close:
      'border-slate-200 text-slate-400 hover:bg-slate-100 hover:text-slate-950 focus-visible:ring-slate-400',
  },
} as const

const newsletterAvatars = [
  '/images/newsletter/avatar-1.svg',
  '/images/newsletter/avatar-2.svg',
  '/images/newsletter/avatar-3.svg',
]

const panelVariants: Variants = {
  hidden: { opacity: 0, scale: 0.96, y: 12 },
  show: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 280, damping: 24, staggerChildren: 0.06, delayChildren: 0.04 },
  },
  exit: { opacity: 0, scale: 0.97, y: 8, transition: { duration: 0.15, ease: 'easeIn' } },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
}

export function SubscribePopup({
  open,
  onClose,
  source,
  theme = 'slate',
  subscriberCount = 0,
}: {
  open: boolean
  onClose: () => void
  source: string
  theme?: SubscribeTheme
  subscriberCount?: number
}) {
  const t = THEME[theme]
  const subscriberLabel = subscriberCount === 1 ? 'reader' : 'readers'
  const [avatarUrls] = useState(() => {
    const firstIndex = Math.floor(Math.random() * newsletterAvatars.length)
    const secondIndex = (firstIndex + 1 + Math.floor(Math.random() * (newsletterAvatars.length - 1))) % newsletterAvatars.length

    return [newsletterAvatars[firstIndex] ?? newsletterAvatars[0], newsletterAvatars[secondIndex] ?? newsletterAvatars[1]]
  })
  if (typeof document === 'undefined') return null

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
            variants={panelVariants}
            initial="hidden"
            animate="show"
            exit="exit"
            className={`relative w-full max-w-2xl overflow-hidden rounded-3xl border ${t.panel} p-6 shadow-2xl sm:p-8`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Decorative glow that spills from the top edge inside the panel. */}
            <div aria-hidden="true" className={`pointer-events-none absolute inset-x-0 top-0 h-40 ${t.glow}`} />

            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className={`absolute right-3.5 top-3.5 flex h-8 w-8 items-center justify-center rounded-full border transition hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${t.close}`}
            >
              <X className="h-4 w-4" />
            </button>

            <div className="relative md:grid md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] md:items-center md:gap-10">
              <div>
                {/* Icon tile with a soft halo behind it. */}
                <motion.div variants={itemVariants} className="relative inline-flex">
                  <span
                    aria-hidden="true"
                    className={`absolute inset-0 scale-[1.35] rounded-2xl bg-gradient-to-br ${t.iconGlow} opacity-30 blur-lg`}
                  />
                  <span className={`relative flex h-12 w-12 items-center justify-center rounded-2xl ${t.iconTile}`}>
                    <Mail className="h-5 w-5" />
                  </span>
                </motion.div>

                <motion.div variants={itemVariants} className="mt-4 space-y-2">
                  <h2 className={`text-xl ${t.title}`}>Get new posts and tools first</h2>
                  <div className="space-y-1.5">
                    <p className={`text-sm leading-relaxed ${t.lead}`}>
                      I send an email when there&apos;s something worth reading.
                    </p>
                    <p className={`flex items-center gap-1.5 text-xs ${t.fine}`}>
                      <ShieldCheck className={`h-3.5 w-3.5 shrink-0 ${t.fineIcon}`} />
                      No spam, unsubscribe anytime.
                    </p>
                  </div>
                </motion.div>
              </div>

              <div className="mt-6 md:mt-0">
                <motion.div variants={itemVariants}>
                  <SubscribeForm source={source} theme={theme} onSuccess={onClose} />
                </motion.div>

                <motion.div
                  variants={itemVariants}
                  className={`mt-3 flex items-center gap-2.5 text-xs ${t.proof}`}
                >
                  <div className="flex shrink-0 -space-x-1.5" aria-hidden="true">
                    <img
                      src={avatarUrls[0]}
                      alt=""
                      className={`h-7 w-7 rounded-full border-2 object-cover ${t.proofAvatarBorder}`}
                    />
                    <img
                      src={avatarUrls[1]}
                      alt=""
                      className={`h-7 w-7 rounded-full border-2 object-cover ${t.proofAvatarBorder}`}
                    />
                  </div>
                  <span>
                    Join <strong className="font-semibold">{subscriberCount.toLocaleString()}</strong> other {subscriberLabel}.
                  </span>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
