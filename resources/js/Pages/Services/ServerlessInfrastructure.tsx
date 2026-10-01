'use client'

import { ServiceHero } from "@/Components/ServiceHero"
import { Button } from "@/Components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card"
import { Cloud, Zap, Lock, ArrowRight, CheckCircle, BarChart, Users, Code, GitBranch, Database } from 'lucide-react'
import { Link } from '@inertiajs/react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/Components/ui/accordion"
import { motion } from "framer-motion"
import { useEffect, useRef, useState } from "react"
import { InfiniteScrollTech } from "@/Components/InfiniteScrollTech"
import { getImageUrl } from "@/lib/imageUtils"

const technologies = [
  {
    name: "AWS Lambda",
    logo: getImageUrl("/images/logos/tech/Amazon_Lambda_architecture_logo.svg"),
  },
  {
    name: "AWS API Gateway",
    logo: getImageUrl("/images/logos/api-gateway.png"),
  },
  {
    name: "AWS DynamoDB",
    logo: getImageUrl("/images/logos/tech/DynamoDB.png"),
  },
  {
    name: "AWS S3",
    logo: getImageUrl("/images/logos/tech/Amazon-S3-Logo.svg"),
  },
  {
    name: "Azure Functions",
    logo: getImageUrl("/images/logos/cloud/functions.png"),
  },
  {
    name: "Google Cloud Functions",
    logo: getImageUrl("/images/logos/tech/google-cloud-functions-logo.svg"),
  },
  {
    name: "Vercel",
    logo: getImageUrl("/images/logos/cloud/logo.png"),
  },
  {
    name: "Netlify",
    logo: getImageUrl("/images/logos/cloud/logomark.png"),
  },
  {
    name: "CloudFlare Workers",
    logo: getImageUrl("/images/logos/cloudflare-workers.svg"),
  },
  {
    name: "AWS Step Functions",
    logo: getImageUrl("/images/logos/step-functions.png"),
  },
  {
    name: "AWS EventBridge",
    logo: getImageUrl("/images/logos/tech/AWS_EventBridge_logo.svg"),
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

export default function ServerlessInfrastructure({ canonicalUrl }: { canonicalUrl?: string }) {
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
      <main className="flex flex-col min-h-screen">
        <ServiceHero
          icon={Cloud}
          title="Serverless Infrastructure"
          description="Lambda, queues, and the rest of a serverless setup, when you want less to patch and a bill that follows the traffic."
          backgroundImage="/service-assets/serverless-infrastructure/hero.jpg"
        />
        <div className="container mx-auto px-4 py-4">
          <Link href="/services" className="inline-flex items-center text-amber-600 hover:text-amber-700 font-medium">
            <ArrowRight className="w-4 h-4 mr-2 rotate-180" />
            Back to Services
          </Link>
        </div>
        <motion.section className="py-24 bg-white" initial="initial" animate="animate" variants={staggerChildren}>
          <div className="container mx-auto px-4">
            <motion.h2 className="text-3xl font-bold text-center mb-12" variants={fadeInUp}>
              What I do
            </motion.h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: Cloud,
                  title: "Serverless Architecture Design",
                  content:
                    "Lambda, queues, and the data store. I only add a piece if the app needs it.",
                },
                {
                  icon: Code,
                  title: "Function Development",
                  content:
                    "I write the function, set the memory, and check that a cold start isn't the thing users wait on.",
                },
                {
                  icon: Database,
                  title: "Data Integration",
                  content: "The function has to talk to the database and the queue you already use.",
                },
              ].map((service, index) => (
                <motion.div key={index} variants={fadeInUp}>
                  <Card>
                    <CardHeader>
                      <service.icon className="w-10 h-10 text-amber-600 mb-4" />
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
              Why work with me
            </motion.h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[
                {
                  title: "Mostly Lambda",
                  content:
                    "I use AWS Lambda. Azure or Google Cloud functions only if the project already lives there.",
                },
                {
                  title: "The bill",
                  content:
                    "A function that runs all day is a server with extra steps. I check the bill.",
                },
                {
                  title: "Performance Tuning",
                  content:
                    "I change memory and the code path, then look at the duration, not a feeling.",
                },
                {
                  title: "Security First",
                  content:
                    "The function gets the IAM role it needs, and not the admin role next to it.",
                },
              ].map((item, index) => (
                <motion.div key={index} className="flex items-start space-x-4" variants={fadeInUp}>
                  <CheckCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-1" />
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
              How the work goes
            </motion.h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {[
                {
                  icon: BarChart,
                  title: "1. Assessment",
                  content:
                    "I look at what is always on, and what only runs when a request shows up.",
                },
                {
                  icon: Code,
                  title: "2. Design",
                  content: "You get the functions, the queue, and what stays a normal server.",
                },
                {
                  icon: GitBranch,
                  title: "3. Implementation",
                  content: "I ship the function with a test, a log line, and an alarm.",
                },
                {
                  icon: Users,
                  title: "4. Optimization",
                  content: "I check duration and the bill after it has real traffic.",
                },
              ].map((step, index) => (
                <motion.div key={index} variants={fadeInUp}>
                  <Card>
                    <CardHeader>
                      <step.icon className="w-10 h-10 text-amber-600 mb-4" />
                      <CardTitle>{step.title}</CardTitle>
                    </CardHeader>
                    <CardContent>{step.content}</CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        <InfiniteScrollTech technologies={technologies} backgroundColor="#F8F9FA" />

        <motion.section className="py-24 bg-white" initial="initial" animate="animate" variants={staggerChildren}>
          <div className="container mx-auto px-4 text-center">
            <motion.h2 className="text-3xl font-bold mb-8" variants={fadeInUp}>
              If you want less to patch, and a bill that follows the traffic.
            </motion.h2>
            <motion.div variants={fadeInUp}>
              <Link href="/consultation">
                <Button size="lg" className="bg-slate-900 hover:bg-slate-800 text-white">
                  Book a consult
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
                      "While serverless is powerful, it's not a one-size-fits-all solution. It's particularly well-suited for event-driven applications, APIs, data processing, and applications with variable workloads. However, applications with consistent, long-running processes or those requiring very low latency might be better served by traditional server-based architectures. I can help evaluate your specific use case to determine if serverless is the right choice.",
                  },
                  {
                    question: "How do you handle monitoring and debugging in serverless applications?",
                    answer:
                      "I implement comprehensive monitoring and debugging strategies using cloud-native tools and third-party solutions. This includes: 1) Distributed tracing for function execution, 2) Detailed logging and error tracking, 3) Performance metrics monitoring, 4) Cost tracking and optimization, and 5) Real-time alerts for issues. I also implement proper error handling and retry mechanisms to ensure reliable operation.",
                  },
                  {
                    question: "How do you ensure security in serverless applications?",
                    answer:
                      "Security in serverless applications involves multiple layers: 1) Function-level security through proper IAM roles and permissions, 2) API security using authentication and authorization, 3) Data security through encryption at rest and in transit, 4) Network security with VPC integration when needed, 5) Regular security audits and vulnerability scanning, and 6) Compliance with relevant standards and regulations.",
                  },
                  {
                    question: "How do you handle state management in serverless applications?",
                    answer:
                      "While serverless functions are stateless by nature, I implement various strategies for state management: 1) Using managed database services like DynamoDB or Aurora Serverless, 2) Leveraging caching services for performance optimization, 3) Implementing event-driven architectures for complex workflows, 4) Using step functions for orchestration, and 5) Integrating with message queues for asynchronous processing.",
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
      </main>
    </>
  )
}
