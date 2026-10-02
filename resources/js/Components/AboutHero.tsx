"use client"

import { motion } from "framer-motion"
import { Link } from "@inertiajs/react"
import { Button } from "@/Components/ui/button"
import { FileDown } from "lucide-react"
import { getImageUrl } from "../lib/imageUtils"

export function AboutHero() {
  return (
    <section className="relative overflow-hidden bg-slate-950 pb-10 pt-28 sm:pb-12 sm:pt-32">
      <div className="container mx-auto">
        <div className="flex flex-col lg:flex-row items-center justify-between">
          <motion.div
            className="lg:w-1/2 text-center lg:text-left mb-10 lg:mb-0 pr-0 lg:pr-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="mb-4 text-4xl font-bold text-white lg:text-5xl">15 years, mostly on AWS.</h1>
            <p className="mx-auto mb-8 max-w-2xl text-lg leading-8 text-white/90 lg:mx-0">
              Cloud architecture, release automation, and apps that already have users and have to hold up in production.
            </p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="flex flex-col items-center gap-4 sm:flex-row lg:justify-start"
            >
              <Button
                variant="default"
                size="lg"
                className="bg-white text-amber-600 hover:bg-white/90 transition-all duration-300 group"
                onClick={() => window.open("/cv-harun-r-rayhan.pdf", "_blank")}
              >
                <FileDown className="mr-2 h-5 w-5 group-hover:translate-y-0.5 transition-transform duration-300" />
                Download CV
              </Button>
              <Link href="/consultation" className="text-sm font-medium text-white underline-offset-4 hover:underline">
                Book a consult
              </Link>
            </motion.div>
          </motion.div>
          <motion.div
            className="flex justify-center lg:w-1/2 lg:justify-end"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
          >
            <div className="relative">
              <img
                src={getImageUrl("/images/profile/harun-profile.webp")}
                alt="Harun R. Rayhan - Software Engineer and Cloud Architect"
                width={320}
                height={320}
                className="h-40 w-40 rounded-full border-4 border-white/20 object-cover shadow-2xl sm:h-52 sm:w-52 lg:h-60 lg:w-60"
                loading="eager"
                fetchPriority="high"
                decoding="async"
              />
            </div>
          </motion.div>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white to-transparent"></div>
    </section>
  )
}
