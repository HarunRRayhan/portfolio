"use client"

import { motion } from "framer-motion"
import { LucideIcon } from "lucide-react"
import { getImageUrl } from "../lib/imageUtils"

interface ServiceHeroProps {
  icon: LucideIcon
  title: string
  description: string
}

export function ServiceHero({ icon: Icon, title, description }: ServiceHeroProps) {
  return (
    <section className="py-24 bg-gradient-to-br from-[#86D2F1] via-[#7C3AED] to-[#8B5CF6]">
      <div className="container mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-16 h-16 rounded-lg bg-white/10 flex items-center justify-center mx-auto mb-6"
        >
          <Icon className="w-8 h-8 text-white" />
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-4xl md:text-5xl font-bold text-white mb-6"
        >
          {title}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-xl text-white/90 max-w-3xl mx-auto"
        >
          {description}
        </motion.p>
      </div>
    </section>
  )
} 