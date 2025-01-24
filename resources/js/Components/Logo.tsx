'use client'

import { Link } from '@inertiajs/react'
import { cn } from "@/lib/utils"

interface LogoProps {
  className?: string
}

export function Logo({ className }: LogoProps) {
  return (
    <Link href="/" className={cn("flex items-center justify-center", className)}>
      <div className="w-10 h-10 rounded-xl bg-[#7C3AED] flex items-center justify-center transform hover:scale-105 transition-transform duration-200">
        <span className="text-2xl font-bold text-white">h</span>
      </div>
    </Link>
  )
} 