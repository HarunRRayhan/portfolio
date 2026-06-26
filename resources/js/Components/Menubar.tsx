'use client'

import * as React from 'react'
import { Link, usePage } from '@inertiajs/react'
import { cn } from '@/lib/utils'
import { Logo } from './Logo'
import { ArrowRight, Calendar, Menu } from 'lucide-react'
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
        'fixed inset-x-0 top-0 z-50 border-b transition-all duration-300',
        isScrolled
          ? 'border-slate-200/50 bg-white/85 shadow-[0_14px_40px_-24px_rgba(15,23,42,0.18)] backdrop-blur-xl'
          : 'border-transparent bg-white/70 backdrop-blur-md',
      )}
    >
      <div className="mx-auto grid max-w-7xl items-center gap-3 px-4 py-3 sm:px-6 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:px-8">
        <Link href="/" className="flex shrink-0 items-center gap-3">
          <Logo className="h-9 w-9" />
          <div className="hidden sm:block">
            <p className="text-sm font-semibold tracking-tight text-slate-900">Harun R. Rayhan</p>
            <p className="text-xs text-slate-500">Cloud, DevOps, and product engineering</p>
          </div>
        </Link>

        <nav className="hidden justify-self-center lg:flex lg:w-full lg:justify-center">
          <div className="inline-flex items-center gap-1 rounded-full border border-slate-200/80 bg-white/60 p-1 shadow-sm backdrop-blur-sm">
            {menuItems.map((item) => {
              const active = isActive(item.href)

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'rounded-full px-4 py-2 text-sm font-medium transition-all duration-200',
                    active
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                  )}
                >
                  {item.name}
                </Link>
              )
            })}
          </div>
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Link href="/book">
            <button className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 active:scale-[0.97]">
              <Calendar className="h-3.5 w-3.5" />
              Book a session
            </button>
          </Link>
        </div>

        {/* Mobile hamburger */}
        <div className="flex items-center justify-self-end lg:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <button className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100">
                <Menu className="h-5 w-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 border-slate-200 p-6 pt-12">
              <nav className="flex flex-col gap-1">
                {menuItems.map((item) => {
                  const active = isActive(item.href)
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        'rounded-lg px-3 py-2.5 text-sm font-medium transition',
                        active
                          ? 'bg-slate-900 text-white'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                      )}
                    >
                      {item.name}
                    </Link>
                  )
                })}
              </nav>
              <div className="mt-6 border-t border-slate-200 pt-6">
                <Link href="/book">
                  <button className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800">
                    <Calendar className="h-4 w-4" />
                    Book a session
                  </button>
                </Link>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
