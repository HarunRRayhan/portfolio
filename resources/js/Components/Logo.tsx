'use client'

import { Link } from '@inertiajs/react'
import { cn } from '@/lib/utils'
import { getImageUrl } from '../lib/imageUtils'

interface LogoProps {
  className?: string
}

export function Logo({ className }: LogoProps) {
  return (
    <Link href="/" className={cn('flex items-center justify-center', className)} aria-label="Harun home">
      <img
        src={getImageUrl('/images/brand/harun-logo.svg')}
        alt="Harun logo"
        className="block h-full w-full rounded-xl object-cover"
        loading="eager"
        decoding="async"
      />
    </Link>
  )
}