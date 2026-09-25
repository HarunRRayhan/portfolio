import { useEffect, useRef, useState } from 'react'

/** Run decorative animation only while visible and motion is welcome. */
export function useVisibleAnimation<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [isActive, setIsActive] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    let isVisible = false
    const update = () => setIsActive(isVisible && !document.hidden && !reducedMotion.matches)
    const observer = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting
      update()
    })

    observer.observe(element)
    document.addEventListener('visibilitychange', update)
    reducedMotion.addEventListener('change', update)

    return () => {
      observer.disconnect()
      document.removeEventListener('visibilitychange', update)
      reducedMotion.removeEventListener('change', update)
    }
  }, [])

  return { ref, isActive }
}
