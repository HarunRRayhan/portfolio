'use client'

import { motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'

const companies = [
  { 
    name: 'Microsoft', 
    logo: '/images/companies/microsoft.svg'
  },
  { 
    name: 'Amazon', 
    logo: '/images/companies/amazon.svg'
  },
  { 
    name: 'Google', 
    logo: '/images/companies/google.svg'
  },
  { 
    name: 'Apple', 
    logo: '/images/companies/apple.svg'
  },
  { 
    name: 'Meta', 
    logo: '/images/companies/meta.svg'
  },
  // Duplicate for infinite scroll
  { 
    name: 'Microsoft', 
    logo: '/images/companies/microsoft.svg'
  },
  { 
    name: 'Amazon', 
    logo: '/images/companies/amazon.svg'
  },
  { 
    name: 'Google', 
    logo: '/images/companies/google.svg'
  },
  { 
    name: 'Apple', 
    logo: '/images/companies/apple.svg'
  },
  { 
    name: 'Meta', 
    logo: '/images/companies/meta.svg'
  },
]

export function LogoSection() {
  const [isVisible, setIsVisible] = useState(false)
  const sectionRef = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting)
      },
      { threshold: 0.1 }
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current)
      }
    }
  }, [])

  return (
    <section ref={sectionRef} className="py-24 bg-[#F8F9FA] overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="container mx-auto px-4 text-center mb-12"
      >
        <h2 className="text-4xl font-bold text-gray-900 mb-4">
          Used by Companies Globally
        </h2>
        <p className="text-xl text-gray-600">
          Trusted by tech industry leaders and innovators.
        </p>
      </motion.div>

      <div className="relative w-full">
        <div className="absolute left-0 top-0 w-32 h-full bg-gradient-to-r from-[#F8F9FA] to-transparent z-10" />
        <div className="absolute right-0 top-0 w-32 h-full bg-gradient-to-l from-[#F8F9FA] to-transparent z-10" />
        
        <motion.div
          initial={{ x: 0 }}
          animate={{ x: "-50%" }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: "linear"
          }}
          whileHover={{ scale: 0.95 }}
          className="group flex items-center space-x-24 whitespace-nowrap py-8"
        >
          {companies.map((company, index) => (
            <div
              key={`${company.name}-${index}`}
              className="flex-shrink-0 h-12 w-[180px] transition-all duration-300 group-hover:scale-110"
            >
              <img
                src={company.logo}
                alt={`${company.name} logo`}
                className="w-full h-full object-contain"
              />
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
} 