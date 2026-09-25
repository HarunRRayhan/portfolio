import { createContext, lazy, Suspense, useCallback, useContext, useEffect, useState, ReactNode } from 'react'
import { router } from '@inertiajs/react'
import type { SubscribeTheme } from '@/Components/SubscribeForm'
import { useIdleSubscribe } from '@/hooks/useIdleSubscribe'

const IDLE_MS = 60_000
const SubscribePopup = lazy(() => import('@/Components/SubscribePopup').then(module => ({ default: module.SubscribePopup })))
const DISMISS_KEY = 'subscribe-popup-dismissed'
type NewsletterPageProps = { newsletter?: { subscriberCount?: number } }

/** Admin/authenticated pages (sidebar layout) never show the subscribe popup. */
function isAdminPath(pathname: string) {
  return pathname === '/profile' || pathname.startsWith('/admin')
}

function useIsAdminArea(initialUrl: string) {
  const [isAdmin, setIsAdmin] = useState(() => isAdminPath(new URL(initialUrl, 'http://localhost').pathname))

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

/** Mounted once around the whole app so the idle popup covers every public
 *  page, including Bio, which renders its own layout. */
export function SubscribeProvider({
  children,
  subscriberCount = 0,
  initialUrl = '/',
}: {
  children: ReactNode
  subscriberCount?: number
  initialUrl?: string
}) {
  const isAdminArea = useIsAdminArea(initialUrl)
  const [open, setOpen] = useState(false)
  const [hasOpened, setHasOpened] = useState(false)
  const [source, setSource] = useState('idle-popup')
  const [theme, setTheme] = useState<SubscribeTheme>('slate')
  const [currentSubscriberCount, setCurrentSubscriberCount] = useState(subscriberCount)

  useEffect(() => {
    return router.on('navigate', (event) => {
      const nextCount = (event.detail.page.props as NewsletterPageProps).newsletter?.subscriberCount

      if (typeof nextCount === 'number') setCurrentSubscriberCount(nextCount)
    })
  }, [])

  const openPopup = useCallback((nextSource: string, nextTheme: SubscribeTheme = 'slate') => {
    if (isAdminArea) return
    setSource(nextSource)
    setTheme(nextTheme)
    setHasOpened(true)
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
      {!isAdminArea && hasOpened && (
        <Suspense fallback={null}>
          <SubscribePopup
            open={open}
            onClose={closePopup}
            source={source}
            theme={theme}
            subscriberCount={currentSubscriberCount}
          />
        </Suspense>
      )}
    </SubscribeContext.Provider>
  )
}
