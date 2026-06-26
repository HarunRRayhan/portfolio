'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Star } from 'lucide-react'
import useEmblaCarousel from 'embla-carousel-react'
import { Card } from '@/Components/ui/card'
import { getImageUrl } from '../lib/imageUtils'

const reviews = [
    {
        id: 1,
        content:
            'Harun is an amazing developer. He takes instruction well, takes pride in his work, and is easy to work with. I would recommend Harun without hesitation.',
        author: 'Alen B.',
        position: 'CEO & Co-Founder, Social HP',
        rating: 5,
        image: getImageUrl('/images/clients/alen.png'),
    },
    {
        id: 2,
        content:
            'Harun was instrumental in a series of complex infrastructure upgrades. He made a stressful project feel manageable and delivered high-quality engineering work.',
        author: 'Tyler P.',
        position: 'CEO, SRM Inc.',
        rating: 5,
        image: getImageUrl('/images/avatars/tyler.svg'),
    },
    {
        id: 3,
        content: 'Harun is an expert and is very good at what he does.',
        author: 'Jason L.',
        position: 'Founder, United Innovations Pty Ltd.',
        rating: 5,
        image: getImageUrl('/images/avatars/jason.svg'),
    },
    {
        id: 4,
        content:
            'Harun is a superb professional to work with — responsive, punctual, and careful about understanding project requirements.',
        author: 'Joel G.',
        position: 'CEO, Trinax SG',
        rating: 5,
        image: getImageUrl('/images/clients/joel.jpeg'),
    },
]

export function ReviewSlideSection() {
    const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true })
    const [selectedIndex, setSelectedIndex] = useState(0)

    const scrollTo = useCallback((index: number) => emblaApi && emblaApi.scrollTo(index), [emblaApi])

    const onSelect = useCallback(() => {
        if (!emblaApi) return
        setSelectedIndex(emblaApi.selectedScrollSnap())
    }, [emblaApi])

    useEffect(() => {
        if (!emblaApi) return
        onSelect()
        emblaApi.on('select', onSelect)
        return () => {
            emblaApi.off('select', onSelect)
        }
    }, [emblaApi, onSelect])

    useEffect(() => {
        const autoSlide = setInterval(() => {
            if (emblaApi) emblaApi.scrollNext()
        }, 6000)

        return () => clearInterval(autoSlide)
    }, [emblaApi])

    return (
        <section className="relative overflow-hidden bg-white py-20 sm:py-24" id="testimonials">
            {/* Subtle background accents */}
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute -left-40 bottom-0 h-80 w-80 rounded-full bg-amber-500/5 blur-3xl" />
                <div className="absolute -right-40 top-0 h-80 w-80 rounded-full bg-amber-500/5 blur-3xl" />
            </div>

            <div className="container relative mx-auto px-4">
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="mx-auto max-w-3xl text-center"
                >
                    <div className="mb-4 inline-flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50/80 px-3 py-1.5">
                        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500">
                            Testimonials
                        </span>
                    </div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
                        Trusted by leaders who care about reliability.
                    </h2>
                    <p className="mt-4 text-base leading-7 text-slate-500 sm:text-lg">
                        A few notes from people who have worked with Harun on real delivery, platform, and infrastructure work.
                    </p>
                </motion.div>

                <div className="relative mt-12">
                    <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-white to-transparent" />
                    <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-white to-transparent" />

                    <div className="overflow-hidden" ref={emblaRef}>
                        <div className="flex">
                            {reviews.map((review, index) => (
                                <div key={review.id} className="min-w-0 flex-[0_0_100%] px-3 md:flex-[0_0_50%]">
                                    <motion.div
                                        initial={{ opacity: 0, y: 12 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 0.5, delay: index * 0.08 }}
                                    >
                                        <Card className="relative h-full rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow duration-300 hover:shadow-md">
                                            <div className="flex gap-1 text-amber-400">
                                                {[...Array(review.rating)].map((_, i) => (
                                                    <Star key={i} className="h-4 w-4 fill-current" />
                                                ))}
                                            </div>

                                            <blockquote className="mt-5 text-base leading-7 text-slate-600 sm:text-lg">
                                                &ldquo;{review.content}&rdquo;
                                            </blockquote>

                                            <div className="mt-8 flex items-center gap-4">
                                                <img
                                                    src={review.image}
                                                    alt={review.author}
                                                    className="h-11 w-11 rounded-full border border-slate-200 object-cover"
                                                />
                                                <div>
                                                    <cite className="block not-italic text-sm font-semibold text-slate-900">
                                                        {review.author}
                                                    </cite>
                                                    <span className="text-sm text-slate-400">{review.position}</span>
                                                </div>
                                            </div>
                                        </Card>
                                    </motion.div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="mt-8 flex justify-center gap-3">
                    <button
                        onClick={() => scrollTo(selectedIndex - 1)}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-900"
                        aria-label="Previous testimonial"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </button>
                    <div className="flex items-center gap-1.5">
                        {reviews.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => scrollTo(i)}
                                className={`h-2 w-2 rounded-full transition ${
                                    i === selectedIndex ? 'bg-slate-800' : 'bg-slate-300'
                                }`}
                                aria-label={`Go to testimonial ${i + 1}`}
                            />
                        ))}
                    </div>
                    <button
                        onClick={() => scrollTo(selectedIndex + 1)}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-900"
                        aria-label="Next testimonial"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </button>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="mt-14 grid gap-4 sm:grid-cols-3"
                >
                    {[
                        { value: '120+', label: 'Happy clients' },
                        { value: '4.8/5', label: 'Average rating' },
                        { value: '98%', label: 'Success rate' },
                    ].map((item) => (
                        <div key={item.label} className="rounded-xl border border-slate-200 bg-slate-50/70 p-6 text-center shadow-sm">
                            <div className="font-mono text-3xl font-bold tabular-nums text-slate-900">{item.value}</div>
                            <div className="mt-1 text-sm text-slate-500">{item.label}</div>
                        </div>
                    ))}
                </motion.div>
            </div>
        </section>
    )
}
