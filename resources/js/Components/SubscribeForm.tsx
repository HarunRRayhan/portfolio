import { useState, FormEvent } from 'react'
import { router } from '@inertiajs/react'
import { toast } from 'sonner'
import { ArrowRight } from 'lucide-react'
import { Input } from '@/Components/ui/input'
import { Button } from '@/Components/ui/button'
import { cn } from '@/lib/utils'

export type SubscribeTheme = 'warm' | 'slate'

const THEME = {
  warm: {
    input:
      'bg-white border-[#e4d7c4] focus-visible:ring-[#b8541f]/30 focus-visible:border-[#c98a4b] text-[#2b2320] placeholder:text-[#a08a6f]',
    button: 'bg-[#b8541f] hover:bg-[#9c4419] text-white shadow-sm shadow-[#b8541f]/25',
    error: 'text-[#b8541f]',
  },
  slate: {
    input:
      'bg-white border-slate-200 focus-visible:ring-slate-400/30 focus-visible:border-slate-300 text-slate-950 placeholder:text-slate-400',
    button: 'bg-slate-900 hover:bg-slate-800 text-white shadow-sm',
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
    <form onSubmit={handleSubmit} className={cn('flex flex-col gap-2.5', className)}>
      <Input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        required
        aria-label="Email address"
        className={cn('h-12 rounded-full px-5 text-sm', t.input)}
      />
      <Button
        type="submit"
        disabled={isSubmitting}
        className={cn('group h-12 w-full gap-2 rounded-full text-sm font-semibold', t.button)}
      >
        {isSubmitting ? (
          'Subscribing…'
        ) : (
          <>
            Subscribe
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </>
        )}
      </Button>
      {error && <p className={cn('px-1 text-xs', t.error)}>{error}</p>}
    </form>
  )
}
