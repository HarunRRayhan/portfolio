'use client'

import {motion} from 'framer-motion'
import {useEffect, useRef, useState} from 'react'

const technologies = [
    {
        name: 'Node.js',
        logo: '/images/tech/nodejs.svg'
    },
    {
        name: 'Linux',
        logo: '/images/tech/linux.svg'
    },
    {
        name: 'AWS',
        logo: '/images/tech/aws.svg'
    },
    {
        name: 'Terraform',
        logo: '/images/tech/terraform.svg'
    },
    {
        name: 'Docker',
        logo: '/images/tech/docker.png'
    },
    {
        name: 'Kubernetes',
        logo: '/images/tech/kubernetes.svg'
    },
    {
        name: 'Jenkins',
        logo: '/images/tech/jenkins.svg'
    },
    {
        name: 'GitHub Actions',
        logo: '/images/tech/github-actions.svg'
    },
    {
        name: 'Laravel',
        logo: '/images/tech/laravel.svg'
    },
    {
        name: 'Python',
        logo: '/images/tech/python.svg'
    },
    {
        name: 'Go',
        logo: '/images/tech/go.svg'
    },
    // Duplicate for infinite scroll
    {
        name: 'Node.js',
        logo: '/images/tech/nodejs.svg'
    },
    {
        name: 'Linux',
        logo: '/images/tech/linux.svg'
    },
    {
        name: 'AWS',
        logo: '/images/tech/aws.svg'
    },
    {
        name: 'Terraform',
        logo: '/images/tech/terraform.svg'
    }
]

export function TechStackSection() {
    const [isVisible, setIsVisible] = useState(false)
    const sectionRef = useRef(null)

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsVisible(entry.isIntersecting)
            },
            {threshold: 0.1}
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
                initial={{opacity: 0, y: 50}}
                animate={isVisible ? {opacity: 1, y: 0} : {opacity: 0, y: 50}}
                transition={{duration: 0.8, ease: "easeOut"}}
                className="container mx-auto px-4 text-center mb-12"
            >
                <h2 className="text-4xl font-bold text-gray-900 mb-4">
                    Tech Stack & Expertise
                </h2>
                <p className="text-xl text-gray-600">
                    Proficient in a wide range of modern technologies and tools.
                </p>
            </motion.div>

            <div className="relative w-full">
                <div className="absolute left-0 top-0 w-24 h-full bg-gradient-to-r from-[#F8F9FA] to-transparent z-10"/>
                <div
                    className="absolute right-0 top-0 w-24 h-full bg-gradient-to-l from-[#F8F9FA] to-transparent z-10"/>

                <motion.div
                    initial={{x: 0}}
                    animate={{x: "-50%"}}
                    transition={{
                        duration: 30,
                        repeat: Infinity,
                        ease: "linear"
                    }}
                    whileHover={{scale: 0.95}}
                    className="group flex items-center space-x-16 whitespace-nowrap py-8"
                >
                    {technologies.map((tech, index) => (
                        <div
                            key={`${tech.name}-${index}`}
                            className="flex-shrink-0 h-20 w-[200px] transition-all duration-300 group-hover:scale-110"
                        >
                            <div className="flex flex-col items-center gap-2">
                                <img
                                    src={tech.logo}
                                    alt={`${tech.name} logo`}
                                    className="w-16 h-16 object-contain"
                                />
                                <span className="text-sm font-medium text-gray-600">{tech.name}</span>
                            </div>
                        </div>
                    ))}
                </motion.div>
            </div>
        </section>
    )
}
