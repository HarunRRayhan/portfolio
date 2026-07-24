import { Mail } from 'lucide-react'
import { Button } from '@/Components/ui/button'
import { cn } from '@/lib/utils'
import { useSubscribePopup } from '@/Components/SubscribeProvider'
import { SubscribeTheme } from '@/Components/SubscribeForm'

export function SubscribeButton({
  source,
  theme = 'slate',
  label = 'Subscribe',
  className,
}: {
  source: string
  theme?: SubscribeTheme
  label?: string
  className?: string
}) {
  const { openPopup } = useSubscribePopup()

  return (
    <Button type="button" onClick={() => openPopup(source, theme)} className={cn('gap-2', className)}>
      <Mail className="h-4 w-4" />
      {label}
    </Button>
  )
}
