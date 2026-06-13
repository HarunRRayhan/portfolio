'use client'

import { Link } from '@inertiajs/react'
import { cn } from '@/lib/utils'
import { HarunBrandMark } from './HarunBrandMark'

interface LogoProps {
  className?: string
}

export function Logo({ className }: LogoProps) {
  return (
    <Link href="/" className={cn('flex items-center justify-center', className)} aria-label="Harun home">
      <HarunBrandMark className="h-full w-full" />
    </Link>
  )
}
