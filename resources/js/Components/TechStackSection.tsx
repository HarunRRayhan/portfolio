'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { getImageUrl } from '../lib/imageUtils'

const technologies = [
    { name: 'Node.js', logo: getImageUrl('/images/tech/nodejs.svg') },
    { name: 'Linux', logo: getImageUrl('/images/tech/linux.svg') },
    { name: 'AWS', logo: getImageUrl('/images/tech/aws.svg') },
    { name: 'Terraform', logo: getImageUrl('/images/tech/terraform.svg') },
    { name: 'Docker', logo: getImageUrl('/images/tech/docker.png') },
    { name: 'Kubernetes', logo: getImageUrl('/images/tech/kubernetes.svg') },
    { name: 'Jenkins', logo: getImageUrl('/images/tech/jenkins.svg') },
    { name: 'GitHub Actions', logo: getImageUrl('/images/tech/github-actions.svg') },
    { name: 'Laravel', logo: getImageUrl('/images/tech/laravel.svg') },
    { name: 'Python', logo: getImageUrl('/images/tech/python.svg') },
    { name: 'Go', logo: getImageUrl('/images/tech/go.svg') },
]

const items = [...technologies, ...technologies]

export function TechStackSection() {
    return (
        <section className="border-y border-slate-200 bg-slate-50 py-16 sm:py-20">
            <div className="container mx-auto px-4">
                <div className="mx-auto max-w-3xl text-center">
                    <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">
                        Tech stack
                    </p>
                    <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                        Tools I use to keep systems moving.
                    </h2>
                    <p className="mt-4 text-base leading-7 text-slate-600 sm:text-lg">
                        A practical stack for building, deploying, and operating modern web and cloud systems.
                    </p>
                </div>

                <div className="relative mt-10 overflow-hidden">
                    <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-gradient-to-r from-slate-50 to-transparent" />
                    <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-l from-slate-50 to-transparent" />

                    <motion.div
                        initial={{ x: 0 }}
                        animate={{ x: '-50%' }}
                        transition={{ duration: 28, repeat: Infinity, ease: 'linear' }}
                        className="flex w-max items-center gap-4 py-4"
                    >
                        {items.map((tech, index) => (
                            <div
                                key={`${tech.name}-${index}`}
                                className="flex h-20 w-[180px] items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 shadow-sm"
                            >
                                <img
                                    src={tech.logo}
                                    alt={tech.name}
                                    className="h-10 w-10 object-contain"
                                />
                                <span className="text-sm font-medium text-slate-700">{tech.name}</span>
                            </div>
                        ))}
                    </motion.div>
                </div>
            </div>
        </section>
    )
}
