"use client"

import React, { useEffect, useRef, useState } from "react"
import { Head } from "@inertiajs/react"
import { motion } from "framer-motion"
import { Menubar } from "@/Components/Menubar"
import { Footer } from "@/Components/Footer"
import { ServiceHero } from "@/Components/ServiceHero"
import { Button } from "@/Components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card/index"
import { 
  Cloud, 
  Server, 
  Lock, 
  ArrowRight, 
  CheckCircle, 
  BarChart, 
  Users,
  Landmark, 
  Stethoscope, 
  ShoppingCart, 
  GraduationCap, 
  Factory, 
  Film 
} from "lucide-react"
import { Link } from "@inertiajs/react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/Components/ui/accordion"

const technologies = [
  { name: "AWS", logo: "https://upload.wikimedia.org/wikipedia/commons/9/93/Amazon_Web_Services_Logo.svg" },
  { name: "Azure", logo: "https://upload.wikimedia.org/wikipedia/commons/a/a8/Microsoft_Azure_Logo.svg" },
  { name: "Google Cloud", logo: "https://upload.wikimedia.org/wikipedia/commons/5/51/Google_Cloud_logo.svg" },
  {
    name: "Kubernetes",
    logo: "https://upload.wikimedia.org/wikipedia/commons/3/39/Kubernetes_logo_without_workmark.svg",
  },
  { name: "Docker", logo: "https://www.docker.com/wp-content/uploads/2022/03/vertical-logo-monochromatic.png" },
  { name: "Terraform", logo: "https://www.vectorlogo.zone/logos/terraformio/terraformio-icon.svg" },
  { name: "Ansible", logo: "https://upload.wikimedia.org/wikipedia/commons/2/24/Ansible_logo.svg" },
  { name: "Jenkins", logo: "https://upload.wikimedia.org/wikipedia/commons/e/e9/Jenkins_logo.svg" },
]

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 },
}

const staggerChildren = {
  animate: { transition: { staggerChildren: 0.1 } },
}

export default function CloudArchitecturePage() {
  const [isVisible, setIsVisible] = useState(false)
  const sectionRef = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting)
      },
      { threshold: 0.1 },
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current)
      }
    }
  }, [])

  return (
    <>
      <Head title="Cloud Architecture" />
      <main className="flex flex-col min-h-screen">
        <Menubar />
        <ServiceHero
          icon={Cloud}
          title="Cloud Architecture"
          description="Design and implement scalable, secure, and cost-effective cloud solutions tailored to your business needs."
        />
        <motion.section className="py-24 bg-white" initial="initial" animate="animate" variants={staggerChildren}>
          <div className="container mx-auto px-4">
            <motion.h2 className="text-3xl font-bold text-center mb-12" variants={fadeInUp}>
              Our Cloud Architecture Services
            </motion.h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: Cloud,
                  title: "Scalable Infrastructure",
                  content: "Design cloud architectures that can seamlessly scale to meet your growing business demands.",
                },
                {
                  icon: Server,
                  title: "Cost Optimization",
                  content:
                    "Implement strategies to optimize cloud costs while maintaining high performance and reliability.",
                },
                {
                  icon: Lock,
                  title: "Security-First Design",
                  content:
                    "Ensure your cloud architecture adheres to best security practices and compliance requirements.",
                },
              ].map((service, index) => (
                <motion.div key={index} variants={fadeInUp}>
                  <Card>
                    <CardHeader>
                      <service.icon className="w-10 h-10 text-[#7C3AED] mb-4" />
                      <CardTitle>{service.title}</CardTitle>
                    </CardHeader>
                    <CardContent>{service.content}</CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        <motion.section className="py-24 bg-gray-50" initial="initial" animate="animate" variants={staggerChildren}>
          <div className="container mx-auto px-4">
            <motion.h2 className="text-3xl font-bold text-center mb-12" variants={fadeInUp}>
              Why Choose Us for Cloud Architecture
            </motion.h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[
                {
                  title: "Expertise Across Major Cloud Platforms",
                  content:
                    "Our team is certified in AWS, Azure, and Google Cloud, ensuring we can design the best solution for your needs.",
                },
                {
                  title: "Tailored Solutions",
                  content:
                    "We design cloud architectures that are specifically tailored to your business goals and requirements.",
                },
                {
                  title: "Focus on Security and Compliance",
                  content:
                    "We prioritize security and ensure your cloud architecture meets all necessary compliance standards.",
                },
                {
                  title: "Continuous Optimization",
                  content:
                    "We don't just set it and forget it. We continuously monitor and optimize your cloud architecture for peak performance and cost-efficiency.",
                },
              ].map((item, index) => (
                <motion.div key={index} className="flex items-start space-x-4" variants={fadeInUp}>
                  <CheckCircle className="w-6 h-6 text-[#7C3AED] flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                    <p>{item.content}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        <motion.section className="py-24 bg-white" initial="initial" animate="animate" variants={staggerChildren}>
          <div className="container mx-auto px-4">
            <motion.h2 className="text-3xl font-bold text-center mb-12" variants={fadeInUp}>
              Our Cloud Architecture Process
            </motion.h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {[
                {
                  icon: BarChart,
                  title: "1. Assessment",
                  content: "We begin by thoroughly assessing your current infrastructure and business needs.",
                },
                {
                  icon: Cloud,
                  title: "2. Design",
                  content: "Our experts design a cloud architecture tailored to your specific requirements.",
                },
                {
                  icon: Server,
                  title: "3. Implementation",
                  content: "We implement the designed architecture with a focus on security and scalability.",
                },
                {
                  icon: Users,
                  title: "4. Support & Optimization",
                  content: "We provide ongoing support and continuously optimize your cloud infrastructure.",
                },
              ].map((step, index) => (
                <motion.div key={index} variants={fadeInUp}>
                  <Card>
                    <CardHeader>
                      <step.icon className="w-10 h-10 text-[#7C3AED] mb-4" />
                      <CardTitle>{step.title}</CardTitle>
                    </CardHeader>
                    <CardContent>{step.content}</CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        <motion.section className="py-24 bg-white" initial="initial" animate="animate" variants={staggerChildren}>
          <div className="container mx-auto px-4">
            <motion.h2 className="text-3xl font-bold text-center mb-12" variants={fadeInUp}>
              Industries We Serve
            </motion.h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
              {[
                { name: "Finance", icon: Landmark },
                { name: "Healthcare", icon: Stethoscope },
                { name: "E-commerce", icon: ShoppingCart },
                { name: "Education", icon: GraduationCap },
                { name: "Manufacturing", icon: Factory },
                { name: "Media", icon: Film },
              ].map((industry, index) => (
                <motion.div key={industry.name} className="flex flex-col items-center" variants={fadeInUp}>
                  <industry.icon className="w-12 h-12 text-[#7C3AED] mb-4" />
                  <h3 className="text-lg font-semibold text-center">{industry.name}</h3>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        <section ref={sectionRef} className="py-24 bg-[#F8F9FA] overflow-hidden">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="container mx-auto px-4 text-center mb-12"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Technologies We Use</h2>
            <p className="text-xl text-gray-600">Proficient in a wide range of modern cloud and DevOps technologies.</p>
          </motion.div>

          <div className="relative w-full">
            <div className="absolute left-0 top-0 w-24 h-full bg-gradient-to-r from-[#F8F9FA] to-transparent z-10" />
            <div className="absolute right-0 top-0 w-24 h-full bg-gradient-to-l from-[#F8F9FA] to-transparent z-10" />

            <motion.div
              initial={{ x: 0 }}
              animate={{ x: "-50%" }}
              transition={{
                duration: 30,
                repeat: Number.POSITIVE_INFINITY,
                ease: "linear",
              }}
              whileHover={{ scale: 1.1 }}
              className="group flex items-center space-x-16 whitespace-nowrap py-8"
            >
              {technologies.concat(technologies).map((tech, index) => (
                <div
                  key={`${tech.name}-${index}`}
                  className="flex-shrink-0 h-20 w-[200px] transition-all duration-300 group-hover:scale-110"
                >
                  <div className="flex flex-col items-center gap-2">
                    <img
                      src={tech.logo || "/placeholder.svg"}
                      alt={`${tech.name} logo`}
                      className="w-16 h-16 object-contain"
                    />
                    <span className="text-sm font-medium text-gray-600">{tech.name}</span>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </section>

        <motion.section className="py-24 bg-white" initial="initial" animate="animate" variants={staggerChildren}>
          <div className="container mx-auto px-4 text-center">
            <motion.h2 className="text-3xl font-bold mb-8" variants={fadeInUp}>
              Ready to optimize your cloud architecture?
            </motion.h2>
            <motion.div variants={fadeInUp}>
              <Link href="/contact">
                <Button size="lg" className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white">
                  Get Started
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </motion.div>
          </div>
        </motion.section>

        <motion.section className="py-24 bg-gray-50" initial="initial" animate="animate" variants={staggerChildren}>
          <div className="container mx-auto px-4">
            <motion.h2 className="text-3xl font-bold text-center mb-12" variants={fadeInUp}>
              Frequently Asked Questions
            </motion.h2>
            <motion.div variants={fadeInUp}>
              <Accordion type="single" collapsible className="max-w-3xl mx-auto">
                {[
                  {
                    question: "What cloud platforms do you work with?",
                    answer:
                      "We primarily work with AWS (Amazon Web Services), but we also have expertise in Microsoft Azure and Google Cloud Platform. Our team can help you choose the best cloud platform for your specific needs and requirements.",
                  },
                  {
                    question: "How do you ensure scalability in cloud architecture?",
                    answer:
                      "We design cloud architectures with scalability in mind from the ground up. This includes using auto-scaling groups, load balancers, and serverless technologies where appropriate. We also implement best practices for database scaling and caching to ensure your application can handle increased loads seamlessly.",
                  },
                  {
                    question: "Can you help with cloud migration?",
                    answer:
                      "Yes, we offer comprehensive cloud migration services. We'll assess your current infrastructure, develop a migration strategy, and execute the migration with minimal downtime. Our approach ensures data integrity and maintains business continuity throughout the process.",
                  },
                  {
                    question: "How do you address security concerns in cloud architecture?",
                    answer:
                      "Security is a top priority in our cloud architecture designs. We implement best practices such as encryption at rest and in transit, identity and access management (IAM), network segmentation, and regular security audits. We also ensure compliance with relevant industry standards and regulations.",
                  },
                  {
                    question: "What's your approach to cost optimization in cloud architecture?",
                    answer:
                      "We take a proactive approach to cost optimization. This includes right-sizing resources, leveraging reserved instances or savings plans, implementing auto-scaling to match demand, and using cost allocation tags. We also provide ongoing monitoring and recommendations to ensure your cloud spend remains optimized as your needs evolve.",
                  },
                ].map((faq, index) => (
                  <AccordionItem key={index} value={`item-${index + 1}`}>
                    <AccordionTrigger>{faq.question}</AccordionTrigger>
                    <AccordionContent>{faq.answer}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </motion.div>
          </div>
        </motion.section>
        <Footer />
      </main>
    </>
  )
}
