import { useEffect, useRef, useState, type ReactNode, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import { Share2 } from 'lucide-react'
import { ShareSheet, type ShareSheetTheme } from '@/Components/ShareSheet'

type SharePopoverProps = {
  open: boolean
  anchorRef: RefObject<HTMLElement | null>
  title: string
  url: string
  shareTitle: string
  onClose: () => void
  theme?: ShareSheetTheme
  panelClassName?: string
}

/** A document-level share panel that cannot be clipped by a card or page shell. */
export function SharePopover({
  open,
  anchorRef,
  title,
  url,
  shareTitle,
  onClose,
  theme = 'warm',
  panelClassName = '',
}: SharePopoverProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const [panelPosition, setPanelPosition] = useState({
    left: 16,
    top: 16,
    width: typeof window === 'undefined' ? 352 : Math.max(0, Math.min(352, window.innerWidth - 32)),
    ready: false,
  })

  useEffect(() => {
    if (!open) return

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node
      if (anchorRef.current?.contains(target) || panelRef.current?.contains(target)) return
      onClose()
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)

    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [anchorRef, onClose, open])

  // The sheet is portaled to the document body so card hover transforms and
  // overflow clipping cannot trap it inside a card. Desktop follows the
  // trigger and flips above it when the viewport is short; mobile becomes a
  // bottom sheet.
  useEffect(() => {
    if (!open) return

    const updatePlacement = () => {
      const trigger = anchorRef.current?.getBoundingClientRect()
      const panel = panelRef.current?.getBoundingClientRect()
      if (!trigger || !panel) return

      const mobile = window.innerWidth < 640
      const width = Math.min(352, window.innerWidth - 32)
      const spaceBelow = window.innerHeight - trigger.bottom
      const spaceAbove = trigger.top
      const placeBelow = spaceBelow >= panel.height + 8 || (spaceBelow >= spaceAbove && spaceAbove < panel.height + 8)
      const preferredTop = placeBelow ? trigger.bottom + 8 : trigger.top - panel.height - 8
      const top = mobile
        ? Math.max(16, window.innerHeight - panel.height - 16)
        : Math.min(Math.max(16, preferredTop), Math.max(16, window.innerHeight - panel.height - 16))
      const left = mobile
        ? 16
        : Math.min(Math.max(16, trigger.left), Math.max(16, window.innerWidth - width - 16))

      setPanelPosition({ left, top, width, ready: true })
    }

    const frame = window.requestAnimationFrame(updatePlacement)
    window.addEventListener('resize', updatePlacement)
    window.addEventListener('scroll', updatePlacement, true)

    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener('resize', updatePlacement)
      window.removeEventListener('scroll', updatePlacement, true)
    }
  }, [anchorRef, open, title, url])

  if (!open || typeof document === 'undefined') return null

  return createPortal(
    <div
      ref={panelRef}
      className={`fixed z-40 ${panelClassName}`}
      style={{
        left: panelPosition.left,
        top: panelPosition.top,
        width: panelPosition.width,
        visibility: panelPosition.ready ? 'visible' : 'hidden',
      }}
    >
      <div onMouseDown={(event) => event.stopPropagation()}>
        <ShareSheet title={title} url={url} shareTitle={shareTitle} theme={theme} onClose={onClose} />
      </div>
    </div>,
    document.body,
  )
}

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
      ) : null}
    </div>
  )
}
