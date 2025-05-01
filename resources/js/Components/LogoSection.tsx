'use client'

import { motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'

const companies = [
  {
    name: 'SocialHP Inc.',
    logo: '/images/companies/socialhp.png'
  },
  {
    name: 'LOreal France',
    logo: '/images/companies/loreal.svg'
  },
  {
    name: "Kiehl's",
    logo: '/images/companies/kiehls.svg'
  },
  {
    name: 'Samsung',
    logo: '/images/companies/samsung.png'
  },
  {
    name: 'Prudential',
    logo: '/images/companies/prudential.jpg'
  },
  {
    name: 'Lonza',
    logo: '/images/companies/lonza.svg'
  },
  {
    name: 'Fleetcor',
    logo: '/images/companies/fleetcor.png'
  },
  {
    name: 'NCR',
    logo: '/images/companies/ncr.svg'
  },
  // Duplicate for infinite scroll
  {
    name: 'SocialHP Inc.',
    logo: '/images/companies/socialhp.png'
  },
  {
    name: 'LOreal France',
    logo: '/images/companies/loreal.svg'
  },
  {
    name: "Kiehl's",
    logo: '/images/companies/kiehls.svg'
  },
  {
    name: 'Samsung',
    logo: '/images/companies/samsung.png'
  },
  {
    name: 'Prudential',
    logo: '/images/companies/prudential.jpg'
  },
  {
    name: 'Lonza',
    logo: '/images/companies/lonza.svg'
  },
  {
    name: 'Fleetcor',
    logo: '/images/companies/fleetcor.png'
  },
  {
    name: 'NCR',
    logo: '/images/companies/ncr.svg'
  }
] as Array<{ name: string; logo: string; className?: string }>

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
          Trusted by Global Brands
        </h2>
        <p className="text-xl text-gray-600">
          Delivering scalable solutions to industry leaders worldwide.
        </p>
      </motion.div>

      <div className="relative w-full">
        <div className="absolute left-0 top-0 w-32 h-full bg-gradient-to-r from-[#F8F9FA] to-transparent z-10" />
        <div className="absolute right-0 top-0 w-32 h-full bg-gradient-to-l from-[#F8F9FA] to-transparent z-10" />

        <motion.div
          initial={{ x: 0 }}
          animate={{ x: "-50%" }}
          transition={{
            duration: 40,
            repeat: Infinity,
            ease: "linear"
          }}
          whileHover={{ scale: 0.95 }}
          className="group flex items-center space-x-32 whitespace-nowrap py-8"
        >
          {companies.map((company, index) => (
            <div
              key={`${company.name}-${index}`}
              className={`flex-shrink-0 h-16 w-[200px] transition-all duration-300
                ${(company.name === 'LOreal France' || company.name === "Kiehl's" || company.name === 'Samsung')
                  ? 'scale-110 group-hover:scale-125'
                  : 'group-hover:scale-110'}`}
            >
              <img
                src={company.logo}
                alt={`${company.name} logo`}
                className={`w-full h-full object-contain filter grayscale hover:grayscale-0 transition-all duration-300 ${company.className || ''}`}
              />
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
