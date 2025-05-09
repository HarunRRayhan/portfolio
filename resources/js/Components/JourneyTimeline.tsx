"use client"

import { motion } from "framer-motion"
import { Briefcase, GraduationCap } from "lucide-react"
import { getImageUrl } from "../lib/imageUtils"

const timelineEvents = [
  {
    year: "2023",
    title: "Senior Cloud DevOps Engineer",
    company: "South River Mortgage",
    location: "Annapolis, Maryland, USA (Remote)",
    description:
      "Modernized infrastructure to AWS cloud, reducing expenses by 30% and improving page speed from 50% to 90%.",
    icon: Briefcase,
  },
  {
    year: "2021",
    title: "Senior Software Engineer",
    company: "SocialHP inc.",
    location: "Toronto, Canada (Remote)",
    description:
      "Engineered AWS and Google Cloud infrastructure with 99.9% uptime, reducing scaling costs by 35% and improving deployment frequency by 30%.",
    icon: Briefcase,
  },
  {
    year: "2020",
    title: "Lead Software Engineer",
    company: "Trinax Singapore",
    location: "Singapore (Remote)",
    description:
      "Led backend team in deploying AWS cloud infrastructures, supporting high-traffic applications with 99.9% uptime for multinational corporations.",
    icon: Briefcase,
  },
  {
    year: "2018",
    title: "Software Engineer",
    company: "United Innovations Pty Ltd",
    location: "Australia (Remote)",
    description:
      "Built scalable infrastructure on AWS Cloud serving millions of requests with sub-100ms response times.",
    icon: Briefcase,
  },
]

export function JourneyTimeline() {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <motion.h2
          className="text-3xl lg:text-4xl font-bold text-center mb-16 text-gray-900"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          My Professional Journey
        </motion.h2>
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-gradient-to-b from-[#86D2F1] via-[#7C3AED] to-[#8B5CF6]"></div>

          {timelineEvents.map((event, index) => (
            <motion.div
              key={index}
              className={`flex items-center mb-8 ${index % 2 === 0 ? "flex-row-reverse" : ""}`}
              initial={{ opacity: 0, x: index % 2 === 0 ? 50 : -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: index * 0.2 }}
            >
              <div className={`w-1/2 ${index % 2 === 0 ? "text-right pr-8" : "pl-8"}`}>
                <h3 className="text-xl font-semibold text-gray-900 mb-1">{event.title}</h3>
                <p className="text-[#7C3AED] font-medium mb-2">{event.company}</p>
                <p className="text-sm text-gray-500 mb-2">{event.location}</p>
                <p className="text-gray-600">{event.description}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#86D2F1] to-[#7C3AED] flex items-center justify-center z-10">
                <event.icon className="w-6 h-6 text-white" />
              </div>
              <div className={`w-1/2 ${index % 2 === 0 ? "pl-8" : "text-right pr-8"}`}>
                <span className="text-2xl font-bold text-[#7C3AED]">{event.year}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
} 