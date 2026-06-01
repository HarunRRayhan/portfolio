'use client'

import * as React from 'react'
import { Link, usePage } from '@inertiajs/react'
import { cn } from '@/lib/utils'
import { Logo } from './Logo'
import { ArrowRight, Menu } from 'lucide-react'
import { Sheet, SheetContent, SheetTrigger } from '@/Components/ui/sheet'

type MenuItem = {
  name: string
  href: string
}

const menuItems: MenuItem[] = [
  { name: 'Home', href: '/' },
  { name: 'Services', href: '/services' },
  { name: 'Blog', href: '/blog' },
  { name: 'About', href: '/about' },
  { name: 'Contact', href: '/contact' },
]

export function Menubar() {
  const [isScrolled, setIsScrolled] = React.useState(false)
  const { url } = usePage()
  const pathname = url.split('?')[0]

  React.useEffect(() => {
    if (typeof window === 'undefined') return

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 24)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/'
    }

    return pathname === href || pathname.startsWith(`${href}/`)
  }

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 border-b border-slate-200/70 transition-all duration-300',
        isScrolled ? 'bg-white/90 shadow-[0_14px_40px_-24px_rgba(15,23,42,0.45)] backdrop-blur-xl' : 'bg-white/70 backdrop-blur-xl',
      )}
    >
      <div className="mx-auto grid max-w-7xl items-center gap-3 px-4 py-3 sm:px-6 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:px-8">
        <Link href="/" className="flex shrink-0 items-center gap-3">
          <Logo className="h-9 w-9" />
          <div className="hidden sm:block">
            <p className="text-sm font-semibold tracking-tight text-slate-950">Harun R. Rayhan</p>
            <p className="text-xs text-slate-500">Cloud, DevOps, and product engineering</p>
          </div>
        </Link>

        <nav className="hidden justify-self-center lg:flex lg:w-full lg:justify-center">
          <div className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white p-1 shadow-sm">
            {menuItems.map((item) => {
              const active = isActive(item.href)

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'rounded-full px-4 py-2 text-sm font-medium transition-all duration-200',
                    active ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950',
                  )}
                >
                  {item.name}
                </Link>
              )
            })}
          </div>
        </nav>

        <div className="hidden items-center gap-2 md:flex lg:justify-self-end">
          <Link
            href="/blog"
            className="rounded-full px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-950"
          >
            Blog
          </Link>
          <Link
            href="/book"
            className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
          >
            Book a session
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="justify-self-end md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <button
                type="button"
                aria-label="Open navigation"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-900 shadow-sm transition-colors hover:bg-slate-100"
              >
                <Menu className="h-5 w-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[320px] border-l border-slate-200 bg-white p-0">
              <div className="flex h-full flex-col">
                <div className="border-b border-slate-200 px-5 py-5">
                  <div className="flex items-center gap-3">
                    <Logo className="h-8 w-8" />
                    <div>
                      <p className="text-sm font-semibold text-slate-950">Harun R. Rayhan</p>
                      <p className="text-xs text-slate-500">Cloud, DevOps, and product engineering</p>
                    </div>
                  </div>
                </div>

                <nav className="flex-1 space-y-2 px-4 py-5">
                  {menuItems.map((item) => {
                    const active = isActive(item.href)

                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={cn(
                          'block rounded-2xl px-4 py-3 text-sm font-medium transition-colors',
                          active ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100 hover:text-slate-950',
                        )}
                      >
                        {item.name}
                      </Link>
                    )
                  })}
                </nav>

                <div className="border-t border-slate-200 p-4">
                  <Link
                    href="/book"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
                  >
                    Book a session
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
