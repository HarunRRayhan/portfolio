import { createContext, useCallback, useContext, useState, ReactNode } from 'react'
import { Toaster } from 'sonner'
import { SubscribePopup } from '@/Components/SubscribePopup'
import { SubscribeTheme } from '@/Components/SubscribeForm'
import { useIdleSubscribe } from '@/hooks/useIdleSubscribe'

const IDLE_MS = 60_000
const DISMISS_KEY = 'subscribe-popup-dismissed'

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
  const [open, setOpen] = useState(false)
  const [source, setSource] = useState('idle-popup')
  const [theme, setTheme] = useState<SubscribeTheme>('slate')

  const openPopup = useCallback((nextSource: string, nextTheme: SubscribeTheme = 'slate') => {
    setSource(nextSource)
    setTheme(nextTheme)
    setOpen(true)
  }, [])

  const closePopup = useCallback(() => {
    setOpen(false)
    sessionStorage.setItem(DISMISS_KEY, '1')
  }, [])

  useIdleSubscribe(() => openPopup('idle-popup'), IDLE_MS, DISMISS_KEY)

  return (
    <SubscribeContext.Provider value={{ openPopup }}>
      {children}
      <Toaster position="top-right" richColors />
      <SubscribePopup open={open} onClose={closePopup} source={source} theme={theme} />
    </SubscribeContext.Provider>
  )
}
