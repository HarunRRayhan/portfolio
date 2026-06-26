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
        <section className="relative overflow-hidden border-y border-slate-200 bg-slate-900 py-16 sm:py-20">
            {/* Grid overlay */}
            <div
                className="pointer-events-none absolute inset-0 opacity-[0.08]"
                style={{
                    backgroundImage:
                        'linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)',
                    backgroundSize: '48px 48px',
                }}
            />
            <div className="container relative mx-auto">
                <div className="mx-auto max-w-3xl text-center">
                    <div className="mb-4 inline-flex items-center gap-2 rounded-md border border-slate-700 bg-slate-800/80 px-3 py-1.5">
                        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400">
                            Tech Stack
                        </span>
                    </div>
                    <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                        Tools I use to keep systems moving.
                    </h2>
                    <p className="mt-3 text-base leading-7 text-slate-400 sm:text-lg">
                        A practical stack for building, deploying, and operating modern web and cloud systems.
                    </p>
                </div>

                <div className="relative mt-10 overflow-hidden">
                    <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-slate-900 to-transparent" />
                    <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-slate-900 to-transparent" />

                    <motion.div
                        initial={{ x: 0 }}
                        animate={{ x: '-50%' }}
                        transition={{ duration: 32, repeat: Infinity, ease: 'linear' }}
                        className="flex w-max items-center gap-3 py-4"
                    >
                        {items.map((tech, index) => (
                            <div
                                key={`${tech.name}-${index}`}
                                className="flex h-16 w-[160px] items-center gap-3 rounded-lg border border-slate-700/60 bg-slate-800/60 px-4 shadow-sm backdrop-blur-sm"
                            >
                                <img
                                    src={tech.logo}
                                    alt={tech.name}
                                    className="h-8 w-8 object-contain"
                                />
                                <span className="text-sm font-medium text-slate-300">{tech.name}</span>
                            </div>
                        ))}
                    </motion.div>
                </div>
            </div>
        </section>
    )
}
