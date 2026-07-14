'use client'

import * as React from 'react'
import { Link, router, usePage } from '@inertiajs/react'
import { cn } from '@/lib/utils'
import { Logo } from './Logo'
import { Calendar, ChevronDown, ExternalLink, LogOut, Menu, User } from 'lucide-react'
import { Sheet, SheetContent, SheetTrigger } from '@/Components/ui/sheet'

const mainNavItems = [
  { name: 'Home', href: '/' },
  { name: 'Case Studies', href: '/case-studies' },
  { name: 'Services', href: '/services' },
]

const moreItems = [
  { name: 'Blog', href: '/blog' },
  { name: 'About', href: '/about' },
  { name: 'Products', href: '/products' },
]

export function Menubar() {
  const [isScrolled, setIsScrolled] = React.useState(false)
  const [profileOpen, setProfileOpen] = React.useState(false)
  const [moreOpen, setMoreOpen] = React.useState(false)
  const [mobileMoreOpen, setMobileMoreOpen] = React.useState(false)
  const { url } = usePage()
  const pathname = url.split('?')[0]
  const user = usePage().props.auth?.user as { name?: string; email?: string } | null | undefined
  const profileRef = React.useRef<HTMLDivElement>(null)
  const moreRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (typeof window === 'undefined') return

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 24)
    }

    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false)
      }
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false)
      }
    }

    window.addEventListener('scroll', handleScroll)
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      window.removeEventListener('scroll', handleScroll)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleLogout = () => {
    router.post('/logout')
    setProfileOpen(false)
  }

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
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

        {/* Desktop nav */}
        <nav className="hidden justify-self-center lg:flex lg:w-full lg:justify-center">
          <div className="inline-flex items-center gap-1 rounded-full border border-slate-200/80 bg-white/60 p-1 shadow-sm backdrop-blur-sm">
            {mainNavItems.map((item) => {
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

            {/* Products — simple nav link to /products page */}
            <Link
              href="/products"
              className={cn(
                'rounded-full px-4 py-2 text-sm font-medium transition-all duration-200',
                isActive('/products')
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
              )}
            >
              Products
            </Link>

            {/* Contact — standalone */}
            <Link
              href="/contact"
              className={cn(
                'rounded-full px-4 py-2 text-sm font-medium transition-all duration-200',
                isActive('/contact')
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
              )}
            >
              Contact
            </Link>

            {/* More dropdown (Blog, About) */}
            <div className="relative" ref={moreRef}>
              <button
                onClick={() => setMoreOpen(!moreOpen)}
                onMouseEnter={() => setMoreOpen(true)}
                className={cn(
                  'inline-flex items-center gap-1 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200',
                  moreOpen || moreItems.some(i => isActive(i.href))
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                )}
              >
                More
                <ChevronDown className={cn('h-3.5 w-3.5 transition-transform duration-200', moreOpen && 'rotate-180')} />
              </button>
              {moreOpen && (
                <div
                  className="absolute left-0 top-full z-50 mt-2 w-44 origin-top-left rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg"
                  onMouseLeave={() => setMoreOpen(false)}
                >
                  {moreItems.map((item) => {
                    const active = isActive(item.href)
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={cn(
                          'flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition',
                          active
                            ? 'bg-slate-100 text-slate-900'
                            : 'text-slate-700 hover:bg-slate-100',
                        )}
                        onClick={() => setMoreOpen(false)}
                      >
                        {item.name}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Link href="/book">
            <button className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 active:scale-[0.97]">
              <Calendar className="h-3.5 w-3.5" />
              Book a session
            </button>
          </Link>

          {user ? (
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-800 text-xs font-semibold text-white">
                  {(user.name?.charAt(0) ?? '?').toUpperCase()}
                </span>
              </button>

              {profileOpen && (
                <div className="absolute right-0 top-full z-50 mt-2 w-48 origin-top-right rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg">
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-100"
                    onClick={() => setProfileOpen(false)}
                  >
                    <User className="h-4 w-4" />
                    Dashboard
                  </Link>
                  <hr className="my-1 border-slate-100" />
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 transition hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            >
              <User className="h-4 w-4" />
            </Link>
          )}
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
                {[...mainNavItems, { name: 'Products', href: '/products' }, { name: 'Contact', href: '/contact' }].map((item) => {
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

              {/* Mobile more section */}
              <div className="mt-4 border-t border-slate-200 pt-4">
                <button
                  onClick={() => setMobileMoreOpen(!mobileMoreOpen)}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                >
                  More
                  <ChevronDown className={cn('h-4 w-4 transition-transform duration-200', mobileMoreOpen && 'rotate-180')} />
                </button>
                {mobileMoreOpen && (
                  <div className="ml-2 mt-1 flex flex-col gap-1 border-l-2 border-slate-100 pl-2">
                    {moreItems.map((item) => {
                      const active = isActive(item.href)
                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          className={cn(
                            'rounded-lg px-3 py-2 text-sm font-medium transition',
                            active
                              ? 'bg-slate-100 text-slate-900'
                              : 'text-slate-600 hover:bg-slate-100',
                          )}
                        >
                          {item.name}
                        </Link>
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
                    <Link
                      href="/dashboard"
                      className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                      <User className="h-4 w-4" />
                      Dashboard
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-red-200 px-4 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign out
                    </button>
                  </div>
                ) : (
                  <Link href="/login">
                    <button className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
                      <User className="h-4 w-4" />
                      Sign in
                    </button>
                  </Link>
                )}
                <div className="mt-3">
                  <Link href="/book">
                    <button className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800">
                      <Calendar className="h-4 w-4" />
                      Book a session
                    </button>
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
