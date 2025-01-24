'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card } from "@/Components/ui/card"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/Components/ui/carousel"
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Star } from 'lucide-react'
import useEmblaCarousel from 'embla-carousel-react'

const reviews = [
  {
    id: 1,
    content: "Harun's expertise in AWS and DevOps practices transformed our infrastructure. His ability to architect scalable solutions and implement efficient CI/CD pipelines has been invaluable to our organization.",
    author: "Sarah Chen",
    position: "CTO at TechCorp",
    rating: 5,
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
    companyLogo: (
      <svg className="w-20 h-10" viewBox="0 0 100 30">
        <text x="0" y="20" className="text-gray-400 font-bold text-sm">TechCorp</text>
      </svg>
    ),
  },
  {
    id: 2,
    content: "Working with Harun was transformative for our cloud strategy. His deep knowledge of AWS and ability to optimize our infrastructure led to a 40% reduction in cloud costs while improving performance.",
    author: "Michael Rodriguez",
    position: "Lead Developer at CloudSolutions",
    rating: 5,
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Michael",
    companyLogo: (
      <svg className="w-20 h-10" viewBox="0 0 100 30">
        <text x="0" y="20" className="text-gray-400 font-bold text-sm">CloudSolutions</text>
      </svg>
    ),
  },
  {
    id: 3,
    content: "Harun's contributions to our DevOps processes revolutionized our deployment pipeline. His expertise in Kubernetes and Terraform helped us achieve true infrastructure as code.",
    author: "Emily Thompson",
    position: "DevOps Manager at InnovateInc",
    rating: 5,
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Emily",
    companyLogo: (
      <svg className="w-20 h-10" viewBox="0 0 100 30">
        <text x="0" y="20" className="text-gray-400 font-bold text-sm">InnovateInc</text>
      </svg>
    ),
  },
]

export function ReviewSlideSection() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true })
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
        <div className="absolute -left-40 -bottom-40 w-80 h-80 bg-[#7C3AED]/5 rounded-full blur-3xl" />
        <div className="absolute right-0 top-0 w-60 h-60 bg-[#6EE7B7]/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
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
          <div className="absolute left-0 top-0 bottom-0 w-[100px] bg-gradient-to-r from-white to-transparent z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-[100px] bg-gradient-to-l from-white to-transparent z-10" />
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex">
              {reviews.map((review, index) => (
                <div key={review.id} className="flex-[0_0_100%] min-w-0 pl-4 md:flex-[0_0_50%]">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: index * 0.2 }}
                  >
                    <Card className="relative p-6 h-full bg-white border border-gray-200 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300">
                      {/* Rating */}
                      <div className="flex mb-6">
                        {[...Array(review.rating)].map((_, i) => (
                          <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
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
          <button onClick={() => scrollTo(selectedIndex - 1)} className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button onClick={() => scrollTo(selectedIndex + 1)} className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors">
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-16 flex flex-wrap justify-center gap-8 md:gap-16"
        >
          <div className="text-center">
            <div className="text-4xl font-bold text-[#7C3AED] mb-2">120+</div>
            <div className="text-gray-600">Happy Clients</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-[#7C3AED] mb-2">4.9/5</div>
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