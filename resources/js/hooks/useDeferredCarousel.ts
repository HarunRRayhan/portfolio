import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import type { EmblaCarouselType } from 'embla-carousel'

/** Keep server-rendered slides visible; load the carousel shortly before use. */
export function useDeferredCarousel() {
  const viewportRef = useRef<HTMLDivElement>(null)
  const [api, setApi] = useState<EmblaCarouselType>()
  const [loadError, setLoadError] = useState(false)
  const initializeRef = useRef<() => Promise<EmblaCarouselType | undefined>>(async () => undefined)

  // Selective hydration can replay a click before passive effects run.
  // Install the loader during commit so that first click cannot be lost.
  useLayoutEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) return
    let disposed = false
    let instance: EmblaCarouselType | undefined
    let pending: Promise<EmblaCarouselType | undefined> | undefined

    const initialize = () => {
      pending ??= import('embla-carousel')
        .then(({ default: EmblaCarousel }) => {
          if (disposed) return undefined
          instance = EmblaCarousel(viewport, { loop: true })
          setApi(instance)
          return instance
        })
        .catch(() => {
          // Browsers can cache failed module imports. Keep the reviews
          // readable rather than leaving controls that cannot respond.
          if (!disposed) setLoadError(true)
          return undefined
        })
      return pending
    }
    initializeRef.current = initialize

    const observer = typeof IntersectionObserver === 'undefined' ? null : new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) {
        observer?.disconnect()
        void initialize()
      }
    }, { rootMargin: '600px' })
    if (observer) observer.observe(viewport)
    else void initialize()

    return () => {
      disposed = true
      observer?.disconnect()
      instance?.destroy()
      initializeRef.current = async () => undefined
    }
  }, [])

  const ensureReady = useCallback(() => initializeRef.current(), [])
  return { viewportRef, api, ensureReady, loadError }
}
