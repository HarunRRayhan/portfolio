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
      "Moved the mortgage site onto AWS and worked on the slow pages and the bill.",
    icon: Briefcase,
  },
  {
    year: "2021",
    title: "Senior Software Engineer",
    company: "SocialHP inc.",
    location: "Toronto, Canada (Remote)",
    description:
      "Set up the AWS and Google Cloud side, and made releases something the team could run.",
    icon: Briefcase,
  },
  {
    year: "2020",
    title: "Lead Software Engineer",
    company: "Trinax Singapore",
    location: "Singapore (Remote)",
    description:
      "Led the backend work that put client apps on AWS.",
    icon: Briefcase,
  },
  {
    year: "2018",
    title: "Software Engineer",
    company: "United Innovations Pty Ltd",
    location: "Australia (Remote)",
    description:
      "Built the AWS setup the product ran on.",
    icon: Briefcase,
  },
]

export function JourneyTimeline() {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto">
        <motion.h2
          className="text-3xl lg:text-4xl font-bold text-center mb-16 text-gray-900"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          My Professional Journey
        </motion.h2>
        {/* Mobile: stacked list */}
        <div className="space-y-8 lg:hidden">
          {timelineEvents.map((event, index) => (
            <motion.div
              key={index}
              className="flex items-start gap-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: index * 0.1 }}
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-slate-700 to-slate-800">
                <event.icon className="h-6 w-6 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-sm font-bold text-amber-600">{event.year}</span>
                <h3 className="mb-1 text-lg font-semibold text-gray-900">{event.title}</h3>
                <p className="mb-1 font-medium text-amber-600">{event.company}</p>
                <p className="mb-2 text-sm text-gray-500">{event.location}</p>
                <p className="text-sm text-gray-600">{event.description}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Desktop: alternating timeline */}
        <div className="relative hidden lg:block">
          {/* Vertical line */}
          <div className="absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-gradient-to-b from-slate-700 via-slate-800 to-slate-900"></div>

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
                <p className="text-amber-600 font-medium mb-2">{event.company}</p>
                <p className="text-sm text-gray-500 mb-2">{event.location}</p>
                <p className="text-gray-600">{event.description}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center z-10">
                <event.icon className="w-6 h-6 text-white" />
              </div>
              <div className={`w-1/2 ${index % 2 === 0 ? "pl-8" : "text-right pr-8"}`}>
                <span className="text-2xl font-bold text-amber-600">{event.year}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
} 