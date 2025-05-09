'use client'

import { motion } from "framer-motion"
import { Icons } from "@/lib/icons"
import { Button } from "@/Components/ui/button"
import { Logo } from "@/Components/Logo"
import { Link } from "@inertiajs/react"
import { HandMetal, ArrowRight } from 'lucide-react'
import { getImageUrl } from "../lib/imageUtils"

export function Footer() {
  return (
    <footer className="relative">
      {/* Main Footer Section */}
      <div className="relative bg-gradient-to-r from-[#86D2F1] via-[#7C3AED] to-[#8B5CF6]">
        {/* CTA Section - Positioned to overlap */}
        <div className="absolute left-0 right-0 -top-16">
          <div className="relative z-10 mx-auto max-w-7xl px-4">
            <div className="bg-[#1a1a2e] rounded-[24px] shadow-2xl">
              <div className="px-8 py-12">
                <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                  <div className="space-y-2">
                    <h2 className="text-3xl md:text-4xl font-bold text-white">Ready to level up?</h2>
                    <p className="text-gray-400">Let's build something extraordinary together</p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Link href="/services">
                      <Button
                        variant="outline"
                        className="relative group bg-transparent text-white hover:text-white hover:bg-white/10 border-white/20 font-medium px-6 py-2 rounded-full flex items-center gap-2 transition-all duration-300"
                      >
                        View Services
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                      </Button>
                    </Link>
                    <Link href="/contact">
                      <Button
                        className="relative group bg-[#6EE7B7] hover:bg-[#6EE7B7]/90 text-[#1a1a2e] font-medium px-6 py-2 rounded-full flex items-center gap-2 transition-all duration-300"
                      >
                        <HandMetal className="w-4 h-4 group-hover:rotate-12 transition-transform duration-300" />
                        Start a Project
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 pt-32 pb-16">
          <div className="flex flex-col items-center">
            {/* Logo & Tagline */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center space-y-8 mb-16"
            >
              <div className="relative inline-block">
                <Logo className="w-20 h-20 relative z-10" />
                <div className="absolute inset-0 bg-white/10 rounded-full blur-xl transform scale-150" />
              </div>
              <div className="space-y-4">
                <h3 className="text-3xl font-bold text-white">Building the Future</h3>
                <p className="text-xl text-white/90 max-w-xl mx-auto font-light">
                  Crafting scalable solutions and empowering teams through DevOps excellence and cloud innovation.
                </p>
              </div>
            </motion.div>

            {/* Quick Links */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16 w-full max-w-4xl"
            >
              <div className="text-center">
                <h4 className="text-white font-semibold mb-4">Services</h4>
                <ul className="space-y-2">
                  <li><Link href="/services/devops" className="text-white/80 hover:text-white transition-colors">DevOps</Link></li>
                  <li><Link href="/services/aws-cloud" className="text-white/80 hover:text-white transition-colors">Cloud Solutions</Link></li>
                </ul>
              </div>
              <div className="text-center">
                <h4 className="text-white font-semibold mb-4">Resources</h4>
                <ul className="space-y-2">
                  <li><a href="https://blog.harun.dev" target="_blank" rel="noopener noreferrer" className="text-white/80 hover:text-white transition-colors">Blog</a></li>
                  <li><Link href="/" className="text-white/80 hover:text-white transition-colors">Portfolio</Link></li>
                </ul>
              </div>
              <div className="text-center">
                <h4 className="text-white font-semibold mb-4">Company</h4>
                <ul className="space-y-2">
                  <li><Link href="/about" className="text-white/80 hover:text-white transition-colors">About</Link></li>
                  <li><Link href="/contact" className="text-white/80 hover:text-white transition-colors">Contact</Link></li>
                </ul>
              </div>
              <div className="text-center">
                <h4 className="text-white font-semibold mb-4">Legal</h4>
                <ul className="space-y-2">
                  <li><Link href="/privacy" className="text-white/80 hover:text-white transition-colors">Privacy</Link></li>
                  <li><Link href="/terms" className="text-white/80 hover:text-white transition-colors">Terms</Link></li>
                </ul>
              </div>
            </motion.div>

            {/* Social Links */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex flex-wrap justify-center gap-6 mb-16"
            >
              {[
                { href: "https://x.com/HarunRRayhan", icon: Icons.twitter, label: "Twitter" },
                { href: "https://www.linkedin.com/in/harunrrayhan/", icon: Icons.linkedin, label: "LinkedIn" },
                { href: "https://github.com/HarunRRayhan", icon: Icons.github, label: "GitHub" },
                { href: "mailto:me@harun.dev?subject=Hello%20Harun", icon: Icons.mail, label: "Email" },
              ].map((social, index) => (
                <motion.a
                  key={social.label}
                  href={social.href}
                  target={social.href.startsWith('mailto:') ? undefined : '_blank'}
                  rel={social.href.startsWith('mailto:') ? undefined : 'noopener noreferrer'}
                  className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-all duration-300 group relative overflow-hidden"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  whileTap={{ scale: 0.9 }}
                  aria-label={social.label}
                >
                  {social.icon && (
                    <social.icon className="w-6 h-6 text-white group-hover:scale-110 transition-transform duration-300" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-r from-[#6EE7B7]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </motion.a>
              ))}
            </motion.div>

            {/* Bottom Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="text-center space-y-4"
            >
              <p className="text-white/90 text-lg font-light">
                Living, learning, & leveling up one day at a time.
              </p>
              <p className="text-white/80 text-sm">
                Handcrafted with ❤️ by Harun © {new Date().getFullYear()}
              </p>
            </motion.div>
          </div>

          {/* Background Elements */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#6EE7B7]/10 rounded-full blur-3xl opacity-50" />
            <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-[#86D2F1]/10 rounded-full blur-3xl" />
            <div className="absolute top-0 right-0 w-[250px] h-[250px] bg-[#8B5CF6]/10 rounded-full blur-3xl" />
          </div>
        </div>
      </div>
    </footer>
  )
}
