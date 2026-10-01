"use client"

import { motion } from "framer-motion"
import { Heart, Lightbulb, Users, Zap } from "lucide-react"

const values = [
  {
    icon: Lightbulb,
    title: "The plan first",
    description: "Infrastructure changes go through Terraform. You can read the plan before anything is applied.",
  },
  {
    icon: Users,
    title: "A release you can run",
    description: "The pipeline builds, tests, and ships. Your team should be able to use it without me in the room.",
  },
  {
    icon: Zap,
    title: "The bill",
    description: "I look at what you're paying for and not using, then right-size it or turn it off.",
  },
  {
    icon: Heart,
    title: "Notes for the next change",
    description: "I leave the modules, the alarms, and a short note on what to patch.",
  },
]

export function PersonalValues() {
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
          How I work
        </motion.h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {values.map((value, index) => (
            <motion.div
              key={value.title}
              className="bg-gray-50 rounded-lg p-6 shadow-md"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: index * 0.1 }}
            >
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center mb-4">
                <value.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{value.title}</h3>
              <p className="text-gray-600">{value.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
} 