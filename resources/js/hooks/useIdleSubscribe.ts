import { useEffect, useRef } from 'react'

const ACTIVITY_EVENTS = ['mousemove', 'keydown', 'scroll', 'touchstart'] as const

/** Fires `onIdle` after `idleMs` of no mouse/keyboard/scroll/touch activity.
 *  Skips entirely once `sessionStorage[dismissKey]` is set, so a dismissed
 *  or subscribed visitor doesn't get retimed on the next page nav. */
export function useIdleSubscribe(onIdle: () => void, idleMs: number, dismissKey: string) {
  const onIdleRef = useRef(onIdle)
  onIdleRef.current = onIdle

  useEffect(() => {
    if (sessionStorage.getItem(dismissKey)) return

    let timer: ReturnType<typeof setTimeout>

    const reset = () => {
      if (sessionStorage.getItem(dismissKey)) return
      clearTimeout(timer)
      timer = setTimeout(() => {
        if (sessionStorage.getItem(dismissKey)) return
        onIdleRef.current()
      }, idleMs)
    }

    reset()
    ACTIVITY_EVENTS.forEach((event) => window.addEventListener(event, reset, { passive: true }))

    return () => {
      clearTimeout(timer)
      ACTIVITY_EVENTS.forEach((event) => window.removeEventListener(event, reset))
    }
  }, [idleMs, dismissKey])
}
