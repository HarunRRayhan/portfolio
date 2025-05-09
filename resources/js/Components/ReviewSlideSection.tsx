'use client'

import React, {useState, useEffect, useCallback} from 'react'
import {Card} from "@/Components/ui/card"
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/Components/ui/carousel"
import {motion} from 'framer-motion'
import {ChevronLeft, ChevronRight, Star} from 'lucide-react'
import useEmblaCarousel from 'embla-carousel-react'
import {getImageUrl} from "../lib/imageUtils"

const reviews = [
    {
        id: 1,
        content: "Harun is an amazing developer. He takes instruction well and takes pride in his work. I would recommend Harun without hesitation to any one. In addition to being a great programmer, he's a good person. Easy to work with and eager to learn.",
        author: "Alen B.",
        position: "CEO & Co-Founder, Social HP",
        rating: 5,
        image: getImageUrl("/images/clients/alen.png"),
        companyLogo: (
            <svg className="w-20 h-10" viewBox="0 0 100 30">
                <text x="0" y="20" className="text-gray-400 font-bold text-sm">Social HP</text>
            </svg>
        ),
    },
    {
        id: 2,
        content: "Harun is one of the most talented engineers that I have had the pleasure of working with. Over the course of the project, Harun was instrumental in a series of complex infrastructure upgrades, moving from outdated Laravel versions, MySQL upgrades, and moving us to an auto scaling AWS cloud. The overall project took us a few months, and we kept working with Harun even after it was successful. If we did not have Harun, this would have been a much more stressful project. I would highly recommend Harun to anyone who is looking for high quality engineering talent.",
        author: "Tyler P.",
        position: "CEO, SRM Inc.",
        rating: 5,
        image: getImageUrl("/images/avatars/tyler.svg"),
        companyLogo: (
            <svg className="w-20 h-10" viewBox="0 0 100 30">
                <text x="0" y="20" className="text-gray-400 font-bold text-sm">SRM Inc.</text>
            </svg>
        ),
    },
    {
        id: 3,
        content: "Harun is an expert and is very good at what he does!",
        author: "Jason L.",
        position: "Founder at United Innovations Pty Ltd.",
        rating: 5,
        image: getImageUrl("/images/avatars/jason.svg"),
        companyLogo: (
            <svg className="w-20 h-10" viewBox="0 0 100 30">
                <text x="0" y="20" className="text-gray-400 font-bold text-sm">TechCorp</text>
            </svg>
        ),
    },
    {
        id: 4,
        content: "Harun is a superb professional to work with. Extremely responsive, punctual with deliverables and always makes a sincere effort to understand the project requirements carefully. These are arguably the most important traits of a successful freelance developer. Glad that we have completed our project successfully and we are now on to the next project immediately!",
        author: "Joel G.",
        position: "CEO at Trinax SG",
        rating: 5,
        image: getImageUrl("/images/clients/joel.jpeg"),
        companyLogo: (
            <svg className="w-20 h-10" viewBox="0 0 100 30">
                <text x="0" y="20" className="text-gray-400 font-bold text-sm">Trinax SG</text>
            </svg>
        ),
    },
]

export function ReviewSlideSection() {
    const [emblaRef, emblaApi] = useEmblaCarousel({loop: true})
    const [selectedIndex, setSelectedIndex] = useState(0)

    const scrollTo = useCallback((index: number) => emblaApi && emblaApi.scrollTo(index), [emblaApi])

    const onSelect = useCallback(() => {
        if (!emblaApi) return
        setSelectedIndex(emblaApi.selectedScrollSnap())
    }, [emblaApi, setSelectedIndex])

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
        }, 5000)

        return () => clearInterval(autoSlide)
    }, [emblaApi])

    return (
        <section className="py-24 bg-white relative overflow-hidden" id="testimonials">
            {/* Background decorative elements */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute -left-40 -bottom-40 w-80 h-80 bg-[#7C3AED]/5 rounded-full blur-3xl"/>
                <div className="absolute right-0 top-0 w-60 h-60 bg-[#6EE7B7]/5 rounded-full blur-3xl"/>
            </div>

            <div className="container mx-auto px-4">
                <motion.div
                    initial={{opacity: 0, y: 20}}
                    whileInView={{opacity: 1, y: 0}}
                    viewport={{once: true}}
                    transition={{duration: 0.6}}
                    className="text-center mb-16"
                >
                    <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                        Trusted by Industry Leaders
                    </h2>
                    <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                        Hear from technical leaders about their experience working with Harun.
                    </p>
                </motion.div>

                <div className="relative">
                    <div
                        className="absolute left-0 top-0 bottom-0 w-[100px] bg-gradient-to-r from-white to-transparent z-10"/>
                    <div
                        className="absolute right-0 top-0 bottom-0 w-[100px] bg-gradient-to-l from-white to-transparent z-10"/>
                    <div className="overflow-hidden" ref={emblaRef}>
                        <div className="flex">
                            {reviews.map((review, index) => (
                                <div key={review.id} className="flex-[0_0_100%] min-w-0 pl-4 md:flex-[0_0_50%]">
                                    <motion.div
                                        initial={{opacity: 0, y: 20}}
                                        whileInView={{opacity: 1, y: 0}}
                                        viewport={{once: true}}
                                        transition={{duration: 0.6, delay: index * 0.2}}
                                    >
                                        <Card
                                            className="relative p-6 h-full bg-white border border-gray-200 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300">
                                            {/* Rating */}
                                            <div className="flex mb-6">
                                                {[...Array(review.rating)].map((_, i) => (
                                                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current"/>
                                                ))}
                                            </div>

                                            {/* Review content */}
                                            <blockquote className="text-lg text-gray-700 mb-8">
                                                "{review.content}"
                                            </blockquote>

                                            {/* Author info */}
                                            <div className="flex items-center gap-4">
                                                <img
                                                    src={review.image}
                                                    alt={review.author}
                                                    className="w-14 h-14 rounded-full object-cover bg-gray-50"
                                                />
                                                <div>
                                                    <cite className="not-italic font-semibold text-gray-900 block">
                                                        {review.author}
                                                    </cite>
                                                    <span className="text-gray-600 text-sm">
                            {review.position}
                          </span>
                                                </div>
                                            </div>

                                            {/* Company logo */}
                                            <div className="absolute top-6 right-6">
                                                {review.companyLogo}
                                            </div>
                                        </Card>
                                    </motion.div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex justify-center mt-8 gap-2">
                    <button onClick={() => scrollTo(selectedIndex - 1)}
                            className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors">
                        <ChevronLeft className="w-6 h-6"/>
                    </button>
                    <button onClick={() => scrollTo(selectedIndex + 1)}
                            className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors">
                        <ChevronRight className="w-6 h-6"/>
                    </button>
                </div>

                {/* Stats */}
                <motion.div
                    initial={{opacity: 0, y: 20}}
                    whileInView={{opacity: 1, y: 0}}
                    viewport={{once: true}}
                    transition={{duration: 0.6, delay: 0.4}}
                    className="mt-16 flex flex-wrap justify-center gap-8 md:gap-16"
                >
                    <div className="text-center">
                        <div className="text-4xl font-bold text-[#7C3AED] mb-2">120+</div>
                        <div className="text-gray-600">Happy Clients</div>
                    </div>
                    <div className="text-center">
                        <div className="text-4xl font-bold text-[#7C3AED] mb-2">4.8/5</div>
                        <div className="text-gray-600">Average Rating</div>
                    </div>
                    <div className="text-center">
                        <div className="text-4xl font-bold text-[#7C3AED] mb-2">98%</div>
                        <div className="text-gray-600">Success Rate</div>
                    </div>
                </motion.div>
            </div>
        </section>
    )
}
