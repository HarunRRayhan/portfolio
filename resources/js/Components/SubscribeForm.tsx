import { useState, FormEvent } from 'react'
import { router } from '@inertiajs/react'
import { toast } from 'sonner'
import { Input } from '@/Components/ui/input'
import { Button } from '@/Components/ui/button'
import { cn } from '@/lib/utils'

export type SubscribeTheme = 'warm' | 'slate'

const THEME = {
  warm: {
    input: 'bg-white border-[#e4d7c4] focus-visible:ring-[#b8541f] text-[#2b2320] placeholder:text-[#8a6a45]',
    button: 'bg-[#b8541f] hover:bg-[#9c4419] text-white',
    error: 'text-[#b8541f]',
  },
  slate: {
    input: 'bg-white border-slate-200 focus-visible:ring-slate-500 text-slate-950 placeholder:text-slate-400',
    button: 'bg-slate-900 hover:bg-slate-800 text-white',
    error: 'text-red-600',
  },
} as const

export function SubscribeForm({
  source,
  theme = 'slate',
  onSuccess,
  className,
}: {
  source: string
  theme?: SubscribeTheme
  onSuccess?: () => void
  className?: string
}) {
  const t = THEME[theme]
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    router.post(
      '/subscribe',
      { email, source, referrer: document.referrer || null },
      {
        preserveScroll: true,
        onSuccess: () => {
          setIsSubmitting(false)
          setEmail('')
          toast.success("You're subscribed. New tools and posts will land in your inbox.")
          onSuccess?.()
        },
        onError: (errors: Record<string, string>) => {
          setIsSubmitting(false)
          setError(errors.email ?? 'Something went wrong. Please try again.')
          toast.error(errors.email ?? 'Something went wrong. Please try again.')
        },
      },
    )
  }

  return (
    <form onSubmit={handleSubmit} className={cn('flex flex-col gap-2', className)}>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
          className={cn('h-11', t.input)}
        />
        <Button type="submit" disabled={isSubmitting} className={cn('h-11 shrink-0 px-5', t.button)}>
          {isSubmitting ? 'Subscribing…' : 'Subscribe'}
        </Button>
      </div>
      {error && <p className={cn('text-sm', t.error)}>{error}</p>}
    </form>
  )
}
