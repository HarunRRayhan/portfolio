'use client'

import { Menubar } from "@/Components/Menubar"
import { Footer } from "@/Components/Footer"
import { ServiceHero } from "@/Components/ServiceHero"
import { Button } from "@/Components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card"
import { Cloud, Zap, Lock, ArrowRight, CheckCircle, BarChart, Users, Code, GitBranch, Database } from 'lucide-react'
import { Link } from '@inertiajs/react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/Components/ui/accordion"
import { motion } from "framer-motion"
import { useEffect, useRef, useState } from "react"

const technologies = [
  {
    name: "AWS Lambda",
    logo: "https://upload.wikimedia.org/wikipedia/commons/5/5c/Amazon_Lambda_architecture_logo.svg",
  },
  {
    name: "AWS API Gateway",
    logo: "https://d2q66yyjeovezo.cloudfront.net/icon/945f3fc449518a73b9f5f32868db466c-926961f91b072604c42b7f39ce2eaf1c.svg",
  },
  {
    name: "AWS DynamoDB",
    logo: "https://upload.wikimedia.org/wikipedia/commons/f/fd/DynamoDB.png",
  },
  {
    name: "AWS S3",
    logo: "https://upload.wikimedia.org/wikipedia/commons/b/bc/Amazon-S3-Logo.svg",
  },
  {
    name: "Azure Functions",
    logo: "https://azure.microsoft.com/svghandler/functions/?width=300&height=300",
  },
  {
    name: "Google Cloud Functions",
    logo: "https://www.gstatic.com/devrel-devsite/prod/v2f6fb68338062e7c16672db62c4ab042dcaffd7d3236adfb2697c5e6479f1619/cloud/images/products/logos/svg/cloud-functions.svg",
  },
  {
    name: "Vercel",
    logo: "https://assets.vercel.com/image/upload/v1607554385/repositories/vercel/logo.png",
  },
  {
    name: "Netlify",
    logo: "https://www.netlify.com/v3/img/components/logomark.png",
  },
  {
    name: "CloudFlare Workers",
    logo: "https://www.cloudflare.com/static/1e7eafd4d3d1d16d7bb6e8c6a4c1f02c/Cloudflare-Workers-Logotype-Vertical-RGB.svg",
  },
  {
    name: "AWS Step Functions",
    logo: "https://upload.wikimedia.org/wikipedia/commons/0/0f/AWS_Step_Functions_logo.svg",
  },
  {
    name: "AWS EventBridge",
    logo: "https://upload.wikimedia.org/wikipedia/commons/3/3d/AWS_EventBridge_logo.svg",
  },
]

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 },
}

const staggerChildren = {
  animate: { transition: { staggerChildren: 0.1 } },
}

export default function ServerlessInfrastructure() {
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
    <main className="flex flex-col min-h-screen">
      <Menubar />
      <ServiceHero
        icon={Cloud}
        title="Serverless Infrastructure"
        description="Design and implement scalable serverless solutions to reduce operational overhead and costs while improving scalability."
      />
      <motion.section className="py-24 bg-white" initial="initial" animate="animate" variants={staggerChildren}>
        <div className="container mx-auto px-4">
          <motion.h2 className="text-3xl font-bold text-center mb-12" variants={fadeInUp}>
            Our Serverless Infrastructure Services
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Cloud,
                title: "Serverless Architecture Design",
                content:
                  "Design scalable and cost-effective serverless architectures tailored to your specific business needs.",
              },
              {
                icon: Code,
                title: "Function Development",
                content:
                  "Develop and optimize serverless functions with best practices for performance and cost efficiency.",
              },
              {
                icon: Database,
                title: "Data Integration",
                content: "Seamlessly integrate serverless functions with databases, storage, and other cloud services.",
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
            Why Choose Us for Serverless Infrastructure
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                title: "Cloud Provider Expertise",
                content:
                  "Deep expertise across major cloud providers' serverless offerings, including AWS Lambda, Azure Functions, and Google Cloud Functions.",
              },
              {
                title: "Cost Optimization",
                content:
                  "Implement cost-effective serverless architectures with optimized function execution and resource utilization.",
              },
              {
                title: "Performance Tuning",
                content:
                  "Optimize function performance through code optimization, memory allocation, and execution environment configuration.",
              },
              {
                title: "Security First",
                content:
                  "Implement robust security measures including IAM policies, encryption, and secure API endpoints.",
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
            Our Serverless Implementation Process
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              {
                icon: BarChart,
                title: "1. Assessment",
                content:
                  "Evaluate your current architecture and requirements to determine the optimal serverless approach.",
              },
              {
                icon: Code,
                title: "2. Design",
                content: "Design a scalable serverless architecture that meets your performance and cost requirements.",
              },
              {
                icon: GitBranch,
                title: "3. Implementation",
                content: "Develop and deploy serverless functions with proper testing, monitoring, and error handling.",
              },
              {
                icon: Users,
                title: "4. Optimization",
                content: "Continuously monitor and optimize function performance, costs, and resource utilization.",
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

      <section ref={sectionRef} className="py-24 bg-[#F8F9FA] overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="container mx-auto px-4 text-center mb-12"
        >
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Serverless Technologies We Use</h2>
          <p className="text-xl text-gray-600">
            We leverage industry-leading serverless platforms and tools to build scalable solutions.
          </p>
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
            className="flex items-center space-x-16 whitespace-nowrap py-8"
          >
            {technologies.concat(technologies).map((tech, index) => (
              <div
                key={`${tech.name}-${index}`}
                className="flex-shrink-0 h-20 w-[200px] transition-all duration-300 hover:scale-110"
              >
                <div className="flex flex-col items-center gap-2">
                  <img
                    src={tech.logo || "/placeholder.svg"}
                    alt={`${tech.name} logo`}
                    width={64}
                    height={64}
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
            Ready to go serverless?
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
                  question: "What is serverless infrastructure?",
                  answer:
                    "Serverless infrastructure is a cloud computing execution model where the cloud provider automatically manages the infrastructure needed to run your code. You only pay for the actual compute time used by your functions, making it highly cost-effective for many use cases. This approach eliminates the need to provision and manage servers, allowing developers to focus solely on writing code.",
                },
                {
                  question: "What are the benefits of going serverless?",
                  answer:
                    "Serverless offers numerous benefits including: 1) Reduced operational costs - pay only for actual usage, 2) Automatic scaling - handles varying workloads efficiently, 3) Reduced maintenance - no server management required, 4) Faster time to market - focus on code, not infrastructure, 5) Built-in high availability and fault tolerance, and 6) Improved developer productivity through simplified deployment and operations.",
                },
                {
                  question: "Is serverless suitable for all applications?",
                  answer:
                    "While serverless is powerful, it's not a one-size-fits-all solution. It's particularly well-suited for event-driven applications, APIs, data processing, and applications with variable workloads. However, applications with consistent, long-running processes or those requiring very low latency might be better served by traditional server-based architectures. We can help evaluate your specific use case to determine if serverless is the right choice.",
                },
                {
                  question: "How do you handle monitoring and debugging in serverless applications?",
                  answer:
                    "We implement comprehensive monitoring and debugging strategies using cloud-native tools and third-party solutions. This includes: 1) Distributed tracing for function execution, 2) Detailed logging and error tracking, 3) Performance metrics monitoring, 4) Cost tracking and optimization, and 5) Real-time alerts for issues. We also implement proper error handling and retry mechanisms to ensure reliable operation.",
                },
                {
                  question: "How do you ensure security in serverless applications?",
                  answer:
                    "Security in serverless applications involves multiple layers: 1) Function-level security through proper IAM roles and permissions, 2) API security using authentication and authorization, 3) Data security through encryption at rest and in transit, 4) Network security with VPC integration when needed, 5) Regular security audits and vulnerability scanning, and 6) Compliance with relevant standards and regulations.",
                },
                {
                  question: "How do you handle state management in serverless applications?",
                  answer:
                    "While serverless functions are stateless by nature, we implement various strategies for state management: 1) Using managed database services like DynamoDB or Aurora Serverless, 2) Leveraging caching services for performance optimization, 3) Implementing event-driven architectures for complex workflows, 4) Using step functions for orchestration, and 5) Integrating with message queues for asynchronous processing.",
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
  )
} 