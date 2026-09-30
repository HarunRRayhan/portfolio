import { lazy, Suspense, useRef, useState, type ReactNode } from 'react'
import { Share2 } from 'lucide-react'
import type { ShareSheetTheme } from '@/Components/ShareSheet'

// Sharing pulls in QR generation and animation; load it only on intent.
const SharePopover = lazy(() => import('@/Components/SharePopover'))

/** A self-contained share trigger: icon button plus a positioned SharePopover. */
export function ShareButton({
  url,
  title,
  shareTitle,
  label = 'Share',
  theme = 'warm',
  triggerClassName = '',
  panelClassName = '',
  wrapperClassName = 'relative',
  children,
}: {
  url: string
  title: string
  shareTitle: string
  label?: string
  theme?: ShareSheetTheme
  triggerClassName?: string
  panelClassName?: string
  wrapperClassName?: string
  children?: ReactNode
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  return (
    <div className={wrapperClassName} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        className={triggerClassName}
      >
        {children ?? <Share2 className="h-4 w-4" />}
      </button>
      {open ? (
        <Suspense fallback={null}>
          <SharePopover
            open={open}
            anchorRef={ref}
            title={title}
            url={url}
            shareTitle={shareTitle}
            theme={theme}
            panelClassName={panelClassName}
            onClose={() => setOpen(false)}
          />
        </Suspense>
      ) : null}
    </div>
  )
}
