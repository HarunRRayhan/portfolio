import type { SVGProps } from 'react'
import { cn } from '@/lib/utils'

interface HarunBrandMarkProps extends SVGProps<SVGSVGElement> {
  className?: string
}

export function HarunBrandMark({ className, ...rest }: HarunBrandMarkProps) {
  return (
    <svg
      {...rest}
      viewBox="0 0 512 512"
      aria-hidden="true"
      focusable="false"
      className={cn('block', className)}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="32" y="32" width="448" height="448" rx="112" fill="#0F172A" />
      <rect x="64" y="64" width="384" height="384" rx="88" fill="#111827" stroke="#334155" strokeWidth="8" />
      <path d="M162 350V150" stroke="#F8FAFC" strokeWidth="34" strokeLinecap="round" />
      <path
        d="M162 252C190 214 224 200 258 214C290 228 306 258 306 350"
        stroke="#F8FAFC"
        strokeWidth="34"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M306 252C326 218 356 202 390 212"
        stroke="#CBD5E1"
        strokeWidth="34"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M178 398H348" stroke="#475569" strokeWidth="10" strokeLinecap="round" />
    </svg>
  )
}