'use client'

import { Menubar } from "@/Components/Menubar"
import { Footer } from "@/Components/Footer"
import { ServiceHero } from "@/Components/ServiceHero"
import { Button } from "@/Components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card"
import { Zap, BarChart, Gauge, ArrowRight, CheckCircle, Users, Code, Database, Cloud, Network } from 'lucide-react'
import { Link, Head } from '@inertiajs/react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/Components/ui/accordion"
import { motion } from "framer-motion"
import { useEffect, useRef, useState } from "react"
import { InfiniteScrollTech } from "@/Components/InfiniteScrollTech"
import { getImageUrl } from "@/lib/imageUtils"

const technologies = [
  {
    name: "New Relic",
    logo: getImageUrl("/images/logos/performance/new-relic-logo.svg"),
  },
  {
    name: "Datadog",
    logo: getImageUrl("/images/logos/performance/datadog-logo.png"),
  },
  {
    name: "Prometheus",
    logo: getImageUrl("/images/logos/performance/prometheus-logo.svg"),
  },
  {
    name: "Grafana",
    logo: getImageUrl("/images/logos/performance/grafana-logo.svg"),
  },
  {
    name: "Apache JMeter",
    logo: getImageUrl("/images/logos/performance/jmeter-logo.svg"),
  },
  {
    name: "Gatling",
    logo: getImageUrl("/images/logos/performance/gatling-logo.svg"),
  },
  {
    name: "Elastic APM",
    logo: getImageUrl("/images/logos/performance/elastic-logo.svg"),
  },
  {
    name: "Dynatrace",
    logo: getImageUrl("/images/logos/performance/dynatrace-logo.png"),
  },
  {
    name: "Lighthouse",
    logo: getImageUrl("/images/logos/performance/lighthouse-logo.svg"),
  },
  {
    name: "WebPageTest",
    logo: getImageUrl("/images/logos/performance/webpagetest-logo.png"),
  },
  {
    name: "Redis",
    logo: getImageUrl("/images/logos/performance/redis-logo.png"),
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

export default function PerformanceOptimization() {
  return (
    <>
      <Head>
        <title>Cloud Performance Optimization Services | Harun R. Rayhan</title>
        <meta name="description" content="Expert cloud performance optimization services. Enhance your cloud infrastructure efficiency, reduce costs, and improve application performance through advanced optimization techniques." />
        <meta name="keywords" content="cloud performance optimization, infrastructure optimization, cost optimization, application performance, cloud efficiency, performance tuning" />
        
        {/* OpenGraph Tags */}
        <meta property="og:title" content="Cloud Performance Optimization Services | Harun R. Rayhan" />
        <meta property="og:description" content="Expert cloud performance optimization services. Enhance your cloud infrastructure efficiency, reduce costs, and improve application performance through advanced optimization techniques." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={window.location.href} />
        
        {/* Twitter Card Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Cloud Performance Optimization Services | Harun R. Rayhan" />
        <meta name="twitter:description" content="Expert cloud performance optimization services. Enhance your cloud infrastructure efficiency, reduce costs, and improve application performance through advanced optimization techniques." />
        
        {/* Canonical URL */}
        <link rel="canonical" href={window.location.href} />

        {/* JSON-LD Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Service",
            "name": "Cloud Performance Optimization Services",
            "provider": {
              "@type": "Person",
              "name": "Harun R. Rayhan",
              "description": "Cloud Performance Optimization Expert"
            },
            "serviceType": "Cloud Computing Services",
            "description": "Expert cloud performance optimization and consulting services",
            "offers": {
              "@type": "Offer",
              "description": "Infrastructure Optimization, Cost Optimization, Performance Tuning"
            },
            "hasOfferCatalog": {
              "@type": "OfferCatalog",
              "name": "Performance Optimization Services",
              "itemListElement": [
                {
                  "@type": "Offer",
                  "itemOffered": {
                    "@type": "Service",
                    "name": "Infrastructure Optimization",
                    "description": "Optimize cloud infrastructure for maximum efficiency"
                  }
                },
                {
                  "@type": "Offer",
                  "itemOffered": {
                    "@type": "Service",
                    "name": "Cost Optimization",
                    "description": "Reduce cloud infrastructure costs while maintaining performance"
                  }
                },
                {
                  "@type": "Offer",
                  "itemOffered": {
                    "@type": "Service",
                    "name": "Performance Tuning",
                    "description": "Fine-tune applications and services for optimal performance"
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
          icon={Zap}
          title="Performance Optimization"
          description="Optimize your cloud infrastructure for maximum performance, efficiency, and cost-effectiveness."
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
              Our Performance Optimization Services
            </motion.h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: Gauge,
                  title: "Application Performance Tuning",
                  content:
                    "Optimize your application's code, database queries, and overall architecture for maximum speed and efficiency.",
                },
                {
                  icon: Cloud,
                  title: "Infrastructure Optimization",
                  content:
                    "Fine-tune your cloud or on-premises infrastructure to handle increased loads and reduce response times.",
                },
                {
                  icon: BarChart,
                  title: "Performance Monitoring & Analysis",
                  content:
                    "Implement comprehensive monitoring solutions to identify bottlenecks and track performance improvements over time.",
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
              Why Choose Us for Performance Optimization
            </motion.h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[
                {
                  title: "Holistic Approach",
                  content:
                    "We optimize performance across all layers of your stack, from frontend to backend and infrastructure.",
                },
                {
                  title: "Data-Driven Optimization",
                  content: "Our recommendations are based on thorough analysis and real-world performance data.",
                },
                {
                  title: "Scalability Focus",
                  content: "We ensure your systems can handle growth and peak loads without compromising performance.",
                },
                {
                  title: "Continuous Improvement",
                  content:
                    "We implement ongoing monitoring and optimization processes to maintain peak performance over time.",
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
              Our Performance Optimization Process
            </motion.h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {[
                {
                  icon: BarChart,
                  title: "1. Assessment",
                  content: "We conduct a thorough analysis of your current performance metrics and identify bottlenecks.",
                },
                {
                  icon: Code,
                  title: "2. Optimization Strategy",
                  content: "We develop a tailored optimization plan based on our assessment findings.",
                },
                {
                  icon: Zap,
                  title: "3. Implementation",
                  content: "We implement the optimization measures, focusing on high-impact improvements.",
                },
                {
                  icon: Users,
                  title: "4. Monitoring & Refinement",
                  content:
                    "We set up ongoing monitoring and continuously refine the optimizations based on real-world data.",
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
              Ready to supercharge your application's performance?
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
                    question: "What areas of performance do you focus on?",
                    answer:
                      "We focus on all aspects of application and infrastructure performance, including frontend responsiveness, backend efficiency, database optimization, network latency reduction, and infrastructure scalability. Our goal is to improve overall system performance, reduce response times, and enhance user experience.",
                  },
                  {
                    question: "How long does the performance optimization process typically take?",
                    answer:
                      "The duration of the optimization process varies depending on the complexity of your system and the scope of improvements needed. A typical engagement might last 4-8 weeks for the initial assessment and implementation of key optimizations. However, we also offer ongoing optimization services to ensure continued performance improvements over time.",
                  },
                  {
                    question: "Can you help with mobile app performance optimization?",
                    answer:
                      "Yes, we have expertise in optimizing both native mobile apps and mobile web applications. Our mobile optimization services include improving app launch times, reducing battery consumption, optimizing network requests, and enhancing overall app responsiveness. We use mobile-specific profiling tools and follow best practices for iOS and Android platforms.",
                  },
                  {
                    question: "How do you approach database performance optimization?",
                    answer:
                      "Our database optimization approach includes analyzing query performance, optimizing indexing strategies, improving data models, and fine-tuning database configurations. We work with various database systems, including SQL databases like MySQL and PostgreSQL, as well as NoSQL databases like MongoDB. We also implement caching strategies and database sharding when necessary to improve scalability.",
                  },
                  {
                    question: "Do you offer performance optimization for e-commerce platforms?",
                    answer:
                      "Absolutely. We have extensive experience optimizing e-commerce platforms to handle high traffic volumes, especially during peak sales periods. Our e-commerce optimization services include improving page load times, optimizing checkout processes, implementing efficient caching strategies, and ensuring seamless integration with payment gateways and inventory management systems.",
                  },
                  {
                    question: "How do you measure the success of performance optimizations?",
                    answer:
                      "We use a variety of metrics to measure the success of our optimizations, including response times, throughput, error rates, and resource utilization. We also focus on business-relevant metrics such as conversion rates, user engagement, and customer satisfaction scores. We implement comprehensive monitoring solutions to track these metrics before, during, and after the optimization process, providing you with clear visibility into the improvements achieved.",
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