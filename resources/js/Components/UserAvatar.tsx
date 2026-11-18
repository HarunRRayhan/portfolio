import { cn } from '@/lib/utils'

/** A person's picture as a circle, or the first letter of their name when there is no picture. */
export default function UserAvatar({ name, url, className }: { name: string; url?: string | null; className?: string }) {
  return url ? (
    <img src={url} alt="" className={cn('h-9 w-9 shrink-0 rounded-full object-cover', className)} loading="lazy" referrerPolicy="no-referrer" />
  ) : (
    <span aria-hidden className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-sm font-semibold text-amber-950', className)}>
      {(name.charAt(0) || '?').toUpperCase()}
    </span>
  )
}
