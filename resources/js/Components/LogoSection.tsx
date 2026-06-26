'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { getImageUrl } from '../lib/imageUtils'

const companies = [
    { name: 'SocialHP', logo: getImageUrl('/images/companies/socialhp.png') },
    { name: 'L’Oréal', logo: getImageUrl('/images/companies/loreal.svg') },
    { name: "Kiehl's", logo: getImageUrl('/images/companies/kiehls.svg') },
    { name: 'Samsung', logo: getImageUrl('/images/companies/samsung.png') },
    { name: 'Prudential', logo: getImageUrl('/images/companies/prudential.jpg') },
    { name: 'Lonza', logo: getImageUrl('/images/companies/lonza.svg') },
    { name: 'Fleetcor', logo: getImageUrl('/images/companies/fleetcor.png') },
    { name: 'NCR', logo: getImageUrl('/images/companies/ncr.svg') },
]

const items = [...companies, ...companies]

export function LogoSection() {
    return (
        <section className="border-b border-slate-200 bg-slate-50/80 py-14">
            <div className="container mx-auto">
                <div className="mx-auto max-w-2xl text-center">
                    <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                        Trusted by teams across industries
                    </p>
                    <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                        Work that holds up in real production environments.
                    </h2>
                    <p className="mt-3 text-base leading-7 text-slate-500">
                        Experience across product, enterprise, and growth teams — with a focus on reliability,
                        clarity, and long-term maintainability.
                    </p>
                </div>

                <div className="relative mt-8 overflow-hidden">
                    <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-slate-50/80 to-transparent" />
                    <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-slate-50/80 to-transparent" />

                    <motion.div
                        initial={{ x: 0 }}
                        animate={{ x: '-50%' }}
                        transition={{ duration: 36, repeat: Infinity, ease: 'linear' }}
                        className="flex w-max items-center gap-4 py-6"
                    >
                        {items.map((company, index) => (
                            <div
                                key={`${company.name}-${index}`}
                                className="flex h-14 w-[180px] items-center justify-center rounded-lg border border-slate-200 bg-white px-5 shadow-sm"
                            >
                                <img
                                    src={company.logo}
                                    alt={company.name}
                                    className="max-h-9 w-auto object-contain grayscale opacity-60 transition duration-300 hover:opacity-100 hover:grayscale-0"
                                />
                            </div>
                        ))}
                    </motion.div>
                </div>
            </div>
        </section>
    )
}
