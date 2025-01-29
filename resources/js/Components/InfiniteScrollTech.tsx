'use client'

import { motion } from "framer-motion"

interface Technology {
  name: string
  logo: string
}

interface InfiniteScrollTechProps {
  technologies: Technology[]
  backgroundColor?: string
}

export function InfiniteScrollTech({ technologies, backgroundColor = "#F8F9FA" }: InfiniteScrollTechProps) {
  return (
    <section className={`py-24 overflow-hidden`} style={{ backgroundColor }}>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        viewport={{ once: true }}
        className="container mx-auto px-4 text-center mb-12"
      >
        <h2 className="text-4xl font-bold text-gray-900 mb-4">Technologies We Use</h2>
        <p className="text-xl text-gray-600">
          We leverage industry-leading platforms and tools to build scalable solutions.
        </p>
      </motion.div>

      <div className="relative w-full">
        <div className={`absolute left-0 top-0 w-24 h-full bg-gradient-to-r from-[${backgroundColor}] to-transparent z-10`} />
        <div className={`absolute right-0 top-0 w-24 h-full bg-gradient-to-l from-[${backgroundColor}] to-transparent z-10`} />

        <div className="flex overflow-hidden">
          <motion.div
            initial={{ x: 0 }}
            animate={{ x: "-50%" }}
            transition={{
              duration: 120,
              repeat: Number.POSITIVE_INFINITY,
              ease: "linear",
            }}
            className="flex items-center space-x-16 whitespace-nowrap py-8"
          >
            {technologies.concat(technologies).map((tech, index) => (
              <div
                key={`${tech.name}-${index}`}
                className="flex-shrink-0 h-20 w-[200px] transition-all duration-300 hover:scale-110"
              >
                <div className="flex flex-col items-center gap-2">
                  <img
                    src={tech.logo || "/placeholder.svg"}
                    alt={`${tech.name} logo`}
                    width={64}
                    height={64}
                    className="w-16 h-16 object-contain"
                  />
                  <span className="text-sm font-medium text-gray-600">{tech.name}</span>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  )
} 