"use client"

import { motion } from "framer-motion"
import { Heart, Lightbulb, Users, Zap } from "lucide-react"
import { getImageUrl } from "../lib/imageUtils"

const values = [
  {
    icon: Lightbulb,
    title: "Continuous Learning",
    description: "Embracing new technologies and methodologies to stay at the forefront of the industry.",
  },
  {
    icon: Users,
    title: "Collaboration",
    description: "Fostering teamwork and knowledge sharing to achieve collective success.",
  },
  {
    icon: Zap,
    title: "Innovation",
    description: "Pushing boundaries and thinking outside the box to solve complex problems.",
  },
  {
    icon: Heart,
    title: "Passion",
    description: "Bringing enthusiasm and dedication to every project and challenge.",
  },
]

export function PersonalValues() {
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
          Personal Values
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
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#86D2F1] to-[#7C3AED] flex items-center justify-center mb-4">
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