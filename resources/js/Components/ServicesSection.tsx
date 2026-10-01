"use client"

import React from "react"
import { motion } from "framer-motion"
import { Link } from "@inertiajs/react"
import { Cloud, Code2, Database, Globe, Lock, Server, Settings, Users, ArrowRight } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/Components/ui/card/index"
import { getImageUrl } from "../lib/imageUtils"

const services = [
  {
    icon: Cloud,
    title: "Cloud Architecture",
    description: "The layout of the account: network, compute, and what it costs.",
    link: "/services/cloud-architecture"
  },
  {
    icon: Code2,
    title: "DevOps Implementation",
    description: "A pipeline the team can run without me in the room.",
    link: "/services/devops"
  },
  {
    icon: Database,
    title: "Database Optimization",
    description: "Queries, indexes, and the parts of the database that are slow.",
    link: "/services/database"
  },
  {
    icon: Lock,
    title: "Security Consulting",
    description: "Close the paths that are wider than the job, in the account and in the pipeline.",
    link: "/services/security"
  },
  {
    icon: Server,
    title: "Infrastructure as Code",
    description: "Terraform for the infrastructure you already have.",
    link: "/services/infrastructure"
  },
  {
    icon: Settings,
    title: "Performance Optimization",
    description: "Find the slow part, then fix that.",
    link: "/services/performance"
  }
]

export function ServicesSection() {
  return (
    <>
      <section className="relative py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950" />
        <div className="relative text-center mb-16 text-white">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-4xl font-bold tracking-tight mb-4"
          >
            What I can help with
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-xl opacity-90"
          >
            Cloud, releases, databases, and the bill. Each page says what the work is.
          </motion.p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 -mt-32 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, index) => {
            const Icon = service.icon
            return (
              <motion.div
                key={service.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="h-full bg-white hover:shadow-lg transition-shadow duration-300">
                  <CardHeader>
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                      <Icon className="w-6 h-6 text-slate-700" />
                    </div>
                    <CardTitle className="text-xl font-bold">{service.title}</CardTitle>
                    <CardDescription className="text-gray-600 mt-2">{service.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Link 
                      href={service.link} 
                      className="inline-flex items-center text-sm font-medium text-slate-700 hover:text-slate-800 transition-colors"
                    >
                      Learn More
                      <ArrowRight className="ml-1 w-4 h-4" />
                    </Link>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      </section>
    </>
  )
} 