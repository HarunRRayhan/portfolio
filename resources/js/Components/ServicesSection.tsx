"use client"

import React from "react"
import { motion } from "framer-motion"
import { Link } from "@inertiajs/react"
import { Cloud, Code2, Database, Globe, Lock, Server, Settings, Users, ArrowRight } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/Components/ui/card/index"

const services = [
  {
    icon: Cloud,
    title: "Cloud Architecture",
    description: "Design and implement scalable, secure, and cost-effective cloud solutions tailored to your business needs.",
    link: "/services/cloud-architecture"
  },
  {
    icon: Code2,
    title: "DevOps Implementation",
    description: "Streamline your development and operations with cutting-edge DevOps practices and tools.",
    link: "/services/devops"
  },
  {
    icon: Database,
    title: "Database Optimization",
    description: "Optimize your database performance, security, and scalability for improved application responsiveness.",
    link: "/services/database"
  },
  {
    icon: Lock,
    title: "Security Consulting",
    description: "Enhance your cloud and application security with expert consulting and implementation services.",
    link: "/services/security"
  },
  {
    icon: Server,
    title: "Infrastructure as Code",
    description: "Implement and manage your infrastructure using modern IaC tools like Terraform and AWS CDK.",
    link: "/services/infrastructure"
  },
  {
    icon: Settings,
    title: "Performance Optimization",
    description: "Boost your application and infrastructure performance with expert analysis and optimization techniques.",
    link: "/services/performance"
  }
]

export function ServicesSection() {
  return (
    <>
      <section className="relative py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#86D2F1] via-[#7C3AED] to-[#8B5CF6]" />
        <div className="relative text-center mb-16 text-white">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-4xl font-bold tracking-tight mb-4"
          >
            Our Services
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-xl opacity-90"
          >
            Elevate your business with our comprehensive range of software engineering and cloud services.
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
                    <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mb-4">
                      <Icon className="w-6 h-6 text-purple-600" />
                    </div>
                    <CardTitle className="text-xl font-bold">{service.title}</CardTitle>
                    <CardDescription className="text-gray-600 mt-2">{service.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Link 
                      href={service.link} 
                      className="inline-flex items-center text-sm font-medium text-purple-600 hover:text-purple-700 transition-colors"
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