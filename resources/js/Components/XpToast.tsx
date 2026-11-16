import { usePage } from '@inertiajs/react'
import { Sparkles } from 'lucide-react'
import type { PageProps } from '@/types'
import { useEffect, useState } from 'react'

/** "+10 XP" for a few seconds after an action that earned XP (flashed by App\Support\Xp). */
export function XpToast() {
  const { xp } = usePage<PageProps<{ xp?: number | null }>>().props
  const [shown, setShown] = useState<number | null>(null)

  useEffect(() => {
    if (!xp) return
    setShown(xp)
    const t = setTimeout(() => setShown(null), 3500)
    return () => clearTimeout(t)
  }, [xp])

  if (!shown) return null
  return (
    <div role="status" className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-amber-950 shadow-lg">
      <Sparkles className="mr-1.5 inline h-4 w-4" aria-hidden />+{shown} XP
    </div>
  )
}
