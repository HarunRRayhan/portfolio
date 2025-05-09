"use client"

import { motion } from "framer-motion"
import { Button } from "@/Components/ui/button"
import { FileDown } from "lucide-react"
import { getImageUrl } from "../lib/imageUtils"

export function AboutHero() {
  return (
    <section className="relative py-20 overflow-hidden bg-gradient-to-br from-[#86D2F1] via-[#7C3AED] to-[#8B5CF6]">
      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row items-center justify-between">
          <motion.div
            className="lg:w-1/2 text-center lg:text-left mb-10 lg:mb-0 pr-0 lg:pr-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-4xl lg:text-5xl font-bold mb-6 text-white">About</h1>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto lg:mx-0">
              With over 17 years of experience in software engineering, cloud architecture, and DevOps, I've dedicated
              my career to building scalable solutions and empowering teams through innovation and best practices.
            </p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <Button
                variant="default"
                size="lg"
                className="bg-white text-[#7C3AED] hover:bg-white/90 transition-all duration-300 group"
                onClick={() => window.open("/cv-harun-r-rayhan.pdf", "_blank")}
              >
                <FileDown className="mr-2 h-5 w-5 group-hover:translate-y-0.5 transition-transform duration-300" />
                Download CV
              </Button>
            </motion.div>
          </motion.div>
          <motion.div
            className="lg:w-1/2 flex justify-end"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
          >
            <div className="relative">
              <img
                src={getImageUrl("/images/profile/harun-profile.jpeg")}
                alt="Harun R. Rayhan - Software Engineer and Cloud Architect"
                className="w-80 h-80 rounded-full shadow-2xl border-4 border-white/20 object-cover"
                loading="eager"
              />
            </div>
          </motion.div>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white to-transparent"></div>
    </section>
  )
}
