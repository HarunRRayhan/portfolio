"use client"

import React from "react"
import { motion } from "framer-motion"
import { LucideIcon } from "lucide-react"

interface ServiceHeroProps {
  icon: LucideIcon
  title: string
  description: string
}

export function ServiceHero({ icon: Icon, title, description }: ServiceHeroProps) {
  return (
    <section className="py-24 bg-gradient-to-br from-[#86D2F1] via-[#7C3AED] to-[#8B5CF6]">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          <div className="w-20 h-20 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-6">
            <Icon className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">{title}</h1>
          <p className="text-xl text-white/90 max-w-3xl mx-auto">
            {description}
          </p>
        </motion.div>
      </div>
    </section>
  )
} 