import { useEffect, useRef, useState } from 'react'

/** Run decorative animation only while visible and motion is welcome. */
export function useVisibleAnimation<T extends HTMLElement>(mode: 'state' | 'css' = 'state') {
  const ref = useRef<T>(null)
  const [isActive, setIsActive] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const tracks = mode === 'css' ? element.querySelectorAll<HTMLElement>('.marquee-track') : []
    let isVisible = false
    const update = () => {
      const active = isVisible && !document.hidden && !reducedMotion.matches
      if (mode === 'css') {
        // Only the animation state changes. Avoid reconciling every logo and
        // SVG whenever visibility or the reduced-motion preference changes.
        tracks.forEach(track => { track.dataset.running = String(active) })
      } else {
        setIsActive(active)
      }
    }
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
  }, [mode])

  return { ref, isActive }
}
