'use client'

import { cn } from '@/lib/utils'
import { HarunBrandMark } from './HarunBrandMark'

interface LogoProps {
  className?: string
}

export function Logo({ className }: LogoProps) {
  return (
    <span className={cn('flex items-center justify-center', className)}>
      <HarunBrandMark className="h-full w-full" />
    </span>
  )
}
