import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Share2 } from 'lucide-react'
import { ShareSheet, type ShareSheetTheme } from '@/Components/ShareSheet'

/** A self-contained share trigger: icon button + positioned ShareSheet
 *  dropdown, with its own open state and outside-click/Escape dismissal. */
export function ShareButton({
  url,
  title,
  shareTitle,
  label = 'Share',
  theme = 'warm',
  triggerClassName = '',
  panelClassName = 'sm:right-0',
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

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <div className={wrapperClassName} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        className={triggerClassName}
      >
        {children ?? <Share2 className="h-4 w-4" />}
      </button>
      {open && (
        <div
          className={`fixed inset-x-4 bottom-4 z-30 sm:absolute sm:inset-x-auto sm:bottom-auto sm:top-full sm:mt-2 ${panelClassName}`}
        >
          <ShareSheet title={title} url={url} shareTitle={shareTitle} theme={theme} onClose={() => setOpen(false)} />
        </div>
      )}
    </div>
  )
}
