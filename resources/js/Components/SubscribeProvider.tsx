import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react'
import { router } from '@inertiajs/react'
import { Toaster } from 'sonner'
import { SubscribePopup } from '@/Components/SubscribePopup'
import { SubscribeTheme } from '@/Components/SubscribeForm'
import { useIdleSubscribe } from '@/hooks/useIdleSubscribe'

const IDLE_MS = 60_000
const DISMISS_KEY = 'subscribe-popup-dismissed'

/** Admin/authenticated pages (sidebar layout) never show the subscribe popup. */
function isAdminPath(pathname: string) {
  return pathname === '/dashboard' || pathname === '/profile' || pathname.startsWith('/admin')
}

function useIsAdminArea() {
  const [isAdmin, setIsAdmin] = useState(() => isAdminPath(window.location.pathname))

  useEffect(() => {
    return router.on('navigate', (event) => {
      setIsAdmin(isAdminPath(new URL(event.detail.page.url, window.location.origin).pathname))
    })
  }, [])

  return isAdmin
}

type SubscribeContextValue = {
  openPopup: (source: string, theme?: SubscribeTheme) => void
}

const SubscribeContext = createContext<SubscribeContextValue | null>(null)

export function useSubscribePopup() {
  const ctx = useContext(SubscribeContext)
  if (!ctx) throw new Error('useSubscribePopup must be used within a SubscribeProvider')
  return ctx
}

/** Mounted once around the whole app (see app.tsx) so the idle popup and the
 *  toast host cover every page, including Bio, which renders its own layout. */
export function SubscribeProvider({ children }: { children: ReactNode }) {
  const isAdminArea = useIsAdminArea()
  const [open, setOpen] = useState(false)
  const [source, setSource] = useState('idle-popup')
  const [theme, setTheme] = useState<SubscribeTheme>('slate')

  const openPopup = useCallback((nextSource: string, nextTheme: SubscribeTheme = 'slate') => {
    if (isAdminArea) return
    setSource(nextSource)
    setTheme(nextTheme)
    setOpen(true)
  }, [isAdminArea])

  const closePopup = useCallback(() => {
    setOpen(false)
    sessionStorage.setItem(DISMISS_KEY, '1')
  }, [])

  useIdleSubscribe(() => openPopup('idle-popup'), IDLE_MS, DISMISS_KEY)

  return (
    <SubscribeContext.Provider value={{ openPopup }}>
      {children}
      <Toaster position="top-right" richColors />
      {!isAdminArea && <SubscribePopup open={open} onClose={closePopup} source={source} theme={theme} />}
    </SubscribeContext.Provider>
  )
}
