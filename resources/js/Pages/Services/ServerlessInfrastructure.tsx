'use client'

import { Menubar } from "@/Components/Menubar"
import { Footer } from "@/Components/Footer"
import { ServiceHero } from "@/Components/ServiceHero"
import { Button } from "@/Components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card"
import { Cloud, Zap, Lock, ArrowRight, CheckCircle, BarChart, Users, Code, GitBranch, Database } from 'lucide-react'
import { Link, Head } from '@inertiajs/react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/Components/ui/accordion"
import { motion } from "framer-motion"
import { useEffect, useRef, useState } from "react"
import { InfiniteScrollTech } from "@/Components/InfiniteScrollTech"

const technologies = [
  {
    name: "AWS Lambda",
    logo: "https://upload.wikimedia.org/wikipedia/commons/5/5c/Amazon_Lambda_architecture_logo.svg",
  },
  {
    name: "AWS API Gateway",
    logo: "/images/logos/api-gateway.png",
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
    logo: "https://seeklogo.com/images/G/google-cloud-functions-logo-AECD57BFA2-seeklogo.com.png",
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
    logo: "/images/logos/cloudflare-workers.svg",
  },
  {
    name: "AWS Step Functions",
    logo: "/images/logos/step-functions.png",
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
    <>
      <Head>
        <title>Serverless Infrastructure Services | Harun R. Rayhan</title>
        <meta name="description" content="Expert serverless architecture and implementation services. Build scalable, cost-effective applications using AWS Lambda, Azure Functions, and other serverless technologies." />
        <meta name="keywords" content="serverless infrastructure, AWS Lambda, Azure Functions, cloud functions, FaaS, serverless computing, cloud-native architecture" />

        {/* OpenGraph Tags */}
        <meta property="og:title" content="Serverless Infrastructure Services | Harun R. Rayhan" />
        <meta property="og:description" content="Expert serverless architecture and implementation services. Build scalable, cost-effective applications using AWS Lambda, Azure Functions, and other serverless technologies." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={window.location.href} />

        {/* Twitter Card Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Serverless Infrastructure Services | Harun R. Rayhan" />
        <meta name="twitter:description" content="Expert serverless architecture and implementation services. Build scalable, cost-effective applications using AWS Lambda, Azure Functions, and other serverless technologies." />

        {/* Canonical URL */}
        <link rel="canonical" href={window.location.href} />

        {/* JSON-LD Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Service",
            "name": "Serverless Infrastructure Services",
            "provider": {
              "@type": "Person",
              "name": "Harun R. Rayhan",
              "description": "Serverless Architecture Expert"
            },
            "serviceType": "Cloud Computing Services",
            "description": "Expert serverless architecture and implementation services",
            "offers": {
              "@type": "Offer",
              "description": "Serverless Architecture Design, FaaS Implementation, Event-Driven Solutions"
            },
            "hasOfferCatalog": {
              "@type": "OfferCatalog",
              "name": "Serverless Services",
              "itemListElement": [
                {
                  "@type": "Offer",
                  "itemOffered": {
                    "@type": "Service",
                    "name": "Serverless Architecture Design",
                    "description": "Design scalable and cost-effective serverless architectures"
                  }
                },
                {
                  "@type": "Offer",
                  "itemOffered": {
                    "@type": "Service",
                    "name": "FaaS Implementation",
                    "description": "Implement Function-as-a-Service solutions across cloud providers"
                  }
                },
                {
                  "@type": "Offer",
                  "itemOffered": {
                    "@type": "Service",
                    "name": "Event-Driven Architecture",
                    "description": "Build event-driven serverless applications"
                  }
                }
              ]
            }
          })}
        </script>
      </Head>
      <main className="flex flex-col min-h-screen">
        <Menubar />
        <ServiceHero
          icon={Cloud}
          title="Serverless Infrastructure"
          description="Design and implement scalable serverless solutions to reduce operational overhead and costs while improving scalability."
        />
        <div className="container mx-auto px-4 py-4">
          <Link href="/services" className="inline-flex items-center text-[#7C3AED] hover:text-[#6D28D9] font-medium">
            <ArrowRight className="w-4 h-4 mr-2 rotate-180" />
            Back to Services
          </Link>
        </div>
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

        <InfiniteScrollTech technologies={technologies} backgroundColor="#F8F9FA" />

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
    </>
  )
}
