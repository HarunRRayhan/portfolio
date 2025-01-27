"use client"

import React from "react"
import { Head } from "@inertiajs/react"
import { Menubar } from "@/Components/Menubar"
import { Footer } from "@/Components/Footer"
import { Button } from "@/Components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/Components/ui/card/index"
import { ArrowRight, Cloud, Code, Database, Lock, Server, Zap } from "lucide-react"
import { Link } from "@inertiajs/react"

const services = [
  {
    icon: Cloud,
    title: "Cloud Architecture",
    description:
      "Design and implement scalable, secure, and cost-effective cloud solutions tailored to your business needs.",
    link: "/services/cloud-architecture",
  },
  {
    icon: Code,
    title: "DevOps Implementation",
    description: "Streamline your development and operations with cutting-edge DevOps practices and tools.",
    link: "/services/devops",
  },
  {
    icon: Database,
    title: "Database Optimization",
    description:
      "Optimize your database performance, security, and scalability for improved application responsiveness.",
    link: "/services/database-optimization",
  },
  {
    icon: Lock,
    title: "Security Consulting",
    description: "Enhance your cloud and application security with expert consulting and implementation services.",
    link: "/services/security-consulting",
  },
  {
    icon: Server,
    title: "Infrastructure as Code",
    description: "Implement and manage your infrastructure using modern IaC tools like Terraform and AWS CDK.",
    link: "/services/infrastructure-as-code",
  },
  {
    icon: Zap,
    title: "Performance Optimization",
    description:
      "Boost your application and infrastructure performance with expert analysis and optimization techniques.",
    link: "/services/performance-optimization",
  },
]

export default function Services() {
  return (
    <>
      <Head title="Services" />
      <main className="flex flex-col min-h-screen">
        <Menubar />
        <div className="flex-grow">
          <section className="py-24 bg-gradient-to-br from-[#86D2F1] via-[#7C3AED] to-[#8B5CF6]">
            <div className="container mx-auto px-4">
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 text-center">Our Services</h1>
              <p className="text-xl text-white/90 max-w-3xl mx-auto text-center mb-12">
                Elevate your business with our comprehensive range of software engineering and cloud services.
              </p>
            </div>
          </section>

          <section className="py-24 bg-white">
            <div className="container mx-auto px-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {services.map((service, index) => (
                  <Card key={index} className="flex flex-col">
                    <CardHeader>
                      <div className="w-12 h-12 rounded-lg bg-[#7C3AED] bg-opacity-10 flex items-center justify-center mb-4">
                        <service.icon className="w-6 h-6 text-[#7C3AED]" />
                      </div>
                      <CardTitle>{service.title}</CardTitle>
                      <CardDescription>{service.description}</CardDescription>
                    </CardHeader>
                    <CardFooter className="mt-auto">
                      <Link href={service.link}>
                        <Button variant="outline" className="w-full">
                          Learn More
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </Link>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        </div>
        <Footer />
      </main>
    </>
  )
} 