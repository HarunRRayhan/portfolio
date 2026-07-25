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
      <path d="M176 150V362" stroke="#F8FAFC" strokeWidth="34" strokeLinecap="round" />
      <path d="M336 150V362" stroke="#F8FAFC" strokeWidth="34" strokeLinecap="round" />
      <path d="M176 256H336" stroke="#22D3EE" strokeWidth="30" strokeLinecap="round" />
      <circle cx="176" cy="150" r="19" fill="#22D3EE" />
      <circle cx="176" cy="362" r="19" fill="#22D3EE" />
      <circle cx="336" cy="150" r="19" fill="#22D3EE" />
      <circle cx="336" cy="362" r="19" fill="#22D3EE" />
      <circle cx="176" cy="150" r="8" fill="#0F172A" />
      <circle cx="176" cy="362" r="8" fill="#0F172A" />
      <circle cx="336" cy="150" r="8" fill="#0F172A" />
      <circle cx="336" cy="362" r="8" fill="#0F172A" />
    </svg>
  )
}