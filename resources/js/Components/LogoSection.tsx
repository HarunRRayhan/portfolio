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
        <section className="border-b border-blue-100 bg-[linear-gradient(180deg,rgba(248,251,255,0.96)_0%,#ffffff_100%)] py-16">
            <div className="container mx-auto px-4">
                <div className="mx-auto max-w-2xl text-center">
                    <p className="text-sm font-medium uppercase tracking-[0.2em] text-blue-500">
                        Trusted by teams across industries
                    </p>
                    <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                        Work that holds up in real production environments.
                    </h2>
                    <p className="mt-4 text-base leading-7 text-slate-600 sm:text-lg">
                        Experience across product, enterprise, and growth teams — with a focus on reliability,
                        clarity, and long-term maintainability.
                    </p>
                </div>

                <div className="relative mt-10 overflow-hidden">
                    <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-[#f8fbff] to-transparent" />
                    <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-[#f8fbff] to-transparent" />

                    <motion.div
                        initial={{ x: 0 }}
                        animate={{ x: '-50%' }}
                        transition={{ duration: 36, repeat: Infinity, ease: 'linear' }}
                        className="flex w-max items-center gap-4 py-6"
                    >
                        {items.map((company, index) => (
                            <div
                                key={`${company.name}-${index}`}
                                className="flex h-16 w-[190px] items-center justify-center rounded-xl border border-blue-100 bg-white px-5 shadow-[0_1px_0_rgba(29,78,216,0.03)]"
                            >
                                <img
                                    src={company.logo}
                                    alt={company.name}
                                    className="max-h-10 w-auto object-contain grayscale transition duration-300 hover:grayscale-0"
                                />
                            </div>
                        ))}
                    </motion.div>
                </div>
            </div>
        </section>
    )
}
