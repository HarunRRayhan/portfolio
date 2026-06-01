import type { ReactNode } from 'react'
import { Link } from '@inertiajs/react'

type SocialLoginButtonsProps = {
  redirectTo?: string
  compact?: boolean
}

function ProviderBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-[10px] font-bold uppercase tracking-wide text-white">
      {label}
    </span>
  )
}

function SocialLoginButton({
  href,
  label,
  icon,
  className,
}: {
  href: string
  label: string
  icon: ReactNode
  className: string
}) {
  return (
    <Link href={href} className={className}>
      <span className="flex items-center gap-2">
        {icon}
        {label}
      </span>
    </Link>
  )
}

export default function SocialLoginButtons({ redirectTo, compact = false }: SocialLoginButtonsProps) {
  const githubHref = route('social.redirect', { provider: 'github', redirect: redirectTo })
  const googleHref = route('social.redirect', { provider: 'google', redirect: redirectTo })

  return (
    <div className={compact ? 'space-y-3' : 'space-y-4'}>
      <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
        <span className="h-px flex-1 bg-slate-200" />
        <span>Continue with</span>
        <span className="h-px flex-1 bg-slate-200" />
      </div>

      <div className={compact ? 'grid gap-3' : 'grid gap-3 sm:grid-cols-2'}>
        <SocialLoginButton
          href={githubHref}
          label="GitHub"
          icon={<ProviderBadge label="gh" />}
          className="inline-flex w-full items-center justify-center rounded-full border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition-colors hover:border-violet-300 hover:text-violet-700"
        />
        <SocialLoginButton
          href={googleHref}
          label="Google"
          icon={<ProviderBadge label="g" />}
          className="inline-flex w-full items-center justify-center rounded-full border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition-colors hover:border-violet-300 hover:text-violet-700"
        />
      </div>
    </div>
  )
}
