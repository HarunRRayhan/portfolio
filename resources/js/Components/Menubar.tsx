'use client'

import * as React from "react"
import { Link } from '@inertiajs/react'
import { cn } from "@/lib/utils"
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/Components/ui/navigation-menu"
import { Logo } from "./Logo"
import { Menu, ExternalLink } from 'lucide-react'
import { Sheet, SheetContent, SheetTrigger } from "@/Components/ui/sheet"

const menuItems = [
  { name: "Home", href: "/" },
  { name: "Services", href: "/services" },
  { name: "Book a Session", href: "/book" },
  { name: "Blog", href: "https://blog.harun.dev", external: true },
  { name: "About", href: "/about" },
  { name: "Contact", href: "/contact" },
]

export function Menubar() {
  const [isScrolled, setIsScrolled] = React.useState(false)

  React.useEffect(() => {
    if (typeof window === 'undefined') return

    const handleScroll = () => {
      const offset = window.scrollY
      setIsScrolled(offset > 50)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const renderMenuItem = (item: typeof menuItems[0]) => {
    const content = (
      <>
        <span className="relative z-10 flex items-center gap-1">
          {item.name}
          {item.external && <ExternalLink className="w-4 h-4" />}
        </span>
        {item.name === "Book a Session" && (
          <span className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-[#6EE7B7] to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
        )}
      </>
    )

    if (item.external) {
      return (
        <a
          href={item.href}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            navigationMenuTriggerStyle,
            "text-white transition-all duration-300 cursor-pointer no-underline",
            "bg-transparent hover:bg-transparent relative after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-full after:origin-left after:scale-x-0 hover:after:scale-x-100 after:bg-gradient-to-r after:from-[#6EE7B7] after:to-transparent after:transition-transform after:duration-300"
          )}
        >
          {content}
        </a>
      )
    }

    return (
      <Link
        href={item.href}
        className={cn(
          navigationMenuTriggerStyle,
          "text-white transition-all duration-300 cursor-pointer no-underline",
          item.name === "Book a Session"
            ? "!bg-white/90 !text-[#7C3AED] hover:!bg-[#9F7AEA] hover:!text-white transition-all duration-300 relative overflow-hidden group"
            : "bg-transparent hover:bg-transparent relative after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-full after:origin-left after:scale-x-0 hover:after:scale-x-100 after:bg-gradient-to-r after:from-[#6EE7B7] after:to-transparent after:transition-transform after:duration-300"
        )}
      >
        {content}
      </Link>
    )
  }

  return (
    <div
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out",
        isScrolled
          ? "bg-gradient-to-r from-[#86D2F1] via-[#7C3AED] to-[#8B5CF6] shadow-lg backdrop-blur-sm bg-opacity-95"
          : "bg-transparent"
      )}
    >
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Logo className="cursor-pointer" />
        <div className="hidden md:block">
          <NavigationMenu>
            <NavigationMenuList>
              {menuItems.map((item) => (
                <NavigationMenuItem key={item.name}>
                  {renderMenuItem(item)}
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>
        </div>
        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <button className="text-white cursor-pointer">
                <Menu size={24} />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px] bg-[#7C3AED]">
              <nav className="flex flex-col gap-4">
                {menuItems.map((item) => (
                  item.external ? (
                    <a
                      key={item.name}
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white text-lg py-2 px-4 rounded-md transition-all duration-300 hover:cursor-pointer no-underline hover:bg-white/10 flex items-center gap-1"
                    >
                      {item.name}
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  ) : (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        "text-white text-lg py-2 px-4 rounded-md transition-all duration-300 hover:cursor-pointer no-underline",
                        item.name === "Book a Session"
                          ? "!bg-white/90 !text-[#7C3AED] hover:!bg-[#9F7AEA] hover:!text-white relative overflow-hidden group"
                          : "hover:bg-white/10"
                      )}
                    >
                      {item.name}
                      {item.name === "Book a Session" && (
                        <span className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-[#6EE7B7] to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
                      )}
                    </Link>
                  )
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </div>
  )
}
