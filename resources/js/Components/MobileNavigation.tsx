import { useState } from 'react'
import { Link } from '@inertiajs/react'
import { ArrowRight, Calendar, ChevronDown, LogOut, User, type LucideIcon } from 'lucide-react'
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle } from '@/Components/ui/sheet'
import { cn } from '@/lib/utils'

export type MobileNavigationProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCloseAutoFocus: (event: Event) => void
  mainItems: { name: string; href: string }[]
  moreItems: { name: string; href: string; icon: LucideIcon; featured?: boolean }[]
  isActive: (href: string) => boolean
  user: { name?: string; email?: string } | null | undefined
  onLogout: () => void
}

export default function MobileNavigation({ open, onOpenChange, onCloseAutoFocus, mainItems, moreItems, isActive, user, onLogout }: MobileNavigationProps) {
  const [moreOpen, setMoreOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[min(18rem,calc(100vw-2.5rem))] overflow-y-auto border-slate-200 p-6 pt-12" onCloseAutoFocus={onCloseAutoFocus}>
        <SheetTitle className="sr-only">Navigation menu</SheetTitle>
        <SheetDescription className="sr-only">Jump to a page or book a session.</SheetDescription>
        <nav className="flex flex-col gap-1">
          {[...mainItems, { name: 'Contact', href: '/contact' }].map(item => (
            <SheetClose key={item.name} asChild>
              <Link href={item.href} className={cn('rounded-lg px-3 py-3 text-sm font-medium transition', isActive(item.href) ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900')}>
                {item.name}
              </Link>
            </SheetClose>
          ))}
        </nav>

        <div className="mt-4 border-t border-slate-200 pt-4">
          <button onClick={() => setMoreOpen(!moreOpen)} aria-expanded={moreOpen} className="flex w-full items-center justify-between rounded-lg px-3 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100">
            More
            <ChevronDown className={cn('h-4 w-4 transition-transform duration-200', moreOpen && 'rotate-180')} />
          </button>
          {moreOpen && (
            <div className="ml-2 mt-1 flex flex-col gap-1 border-l-2 border-slate-100 pl-2">
              {moreItems.map(item => {
                const Icon = item.icon
                return (
                  <SheetClose key={item.name} asChild>
                    <Link href={item.href} className={cn('flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition', item.featured ? 'border border-amber-200 bg-amber-50 text-amber-950 shadow-sm' : isActive(item.href) ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-100')}>
                      <Icon className={cn('h-4 w-4', item.featured ? 'text-amber-600' : 'text-slate-400')} />
                      {item.name}
                      {item.featured && <span className="ml-auto font-mono text-[9px] font-semibold uppercase tracking-wider text-amber-700">Support</span>}
                    </Link>
                  </SheetClose>
                )
              })}
            </div>
          )}
        </div>

        <div className="mt-6 border-t border-slate-200 pt-6">
          {user ? (
            <div className="flex flex-col gap-2">
              <div className="px-1 pb-1">
                <p className="text-sm font-medium text-slate-900">{user.name ?? 'Account'}</p>
                <p className="text-xs text-slate-500">{user.email}</p>
              </div>
              <SheetClose asChild>
                <Link href={route('dashboard')} className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
                  <User className="h-4 w-4" />Dashboard
                </Link>
              </SheetClose>
              <SheetClose asChild>
                <button onClick={onLogout} className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-red-200 px-4 py-3 text-sm font-medium text-red-600 transition hover:bg-red-50">
                  <LogOut className="h-4 w-4" />Sign out
                </button>
              </SheetClose>
            </div>
          ) : (
            <SheetClose asChild>
              <Link href="/login" className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
                <User className="h-4 w-4" />Sign in
              </Link>
            </SheetClose>
          )}
          <div className="mt-3">
            <SheetClose asChild>
              <Link href="/book" className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800">
                <Calendar className="h-4 w-4" />Book a session
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>
            </SheetClose>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
