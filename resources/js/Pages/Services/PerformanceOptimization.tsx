'use client'

import { ServiceHero } from "@/Components/ServiceHero"
import { Button } from "@/Components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card"
import { Zap, BarChart, Gauge, ArrowRight, CheckCircle, Users, Code, Database, Cloud, Network } from 'lucide-react'
import { Link } from '@inertiajs/react'
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
    logo: getImageUrl("/images/logos/performance/webpagetest-logo.svg"),
  },
  {
    name: "Redis",
    logo: getImageUrl("/images/logos/performance/redis-logo.svg"),
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

export default function PerformanceOptimization({ canonicalUrl }: { canonicalUrl?: string }) {
  const ogImagePath = getImageUrl("/service-assets/performance-optimization/hero.jpg")
  const ogImageUrl = ogImagePath.startsWith("http") ? ogImagePath : `https://harun.dev${ogImagePath}`

  return (
    <>
      <main className="flex flex-col min-h-screen">
        <ServiceHero
          icon={Zap}
          title="Performance Optimization"
          description="I measure the slow path, fix that, and stop paying for capacity you aren't using."
          backgroundImage="/service-assets/performance-optimization/hero.jpg"
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
              How I handle Performance Optimization
            </motion.h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[
                {
                  title: "Holistic Approach",
                  content:
                    "I optimize performance across all layers of your stack, from frontend to backend and infrastructure.",
                },
                {
                  title: "Data-Driven Optimization",
                  content: "My recommendations are based on thorough analysis and real-world performance data.",
                },
                {
                  title: "Scalability Focus",
                  content: "I ensure your systems can handle growth and peak loads without compromising performance.",
                },
                {
                  title: "Continuous Improvement",
                  content:
                    "I implement ongoing monitoring and optimization processes to maintain peak performance over time.",
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
                  content: "I conduct a thorough analysis of your current performance metrics and identify bottlenecks.",
                },
                {
                  icon: Code,
                  title: "2. Optimization Strategy",
                  content: "I develop a tailored optimization plan based on my assessment findings.",
                },
                {
                  icon: Zap,
                  title: "3. Implementation",
                  content: "I implement the optimization measures, focusing on high-impact improvements.",
                },
                {
                  icon: Users,
                  title: "4. Monitoring & Refinement",
                  content:
                    "I set up ongoing monitoring and continuously refine the optimizations based on real-world data.",
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
              Ready to supercharge your application's performance?
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
                    question: "What areas of performance do you focus on?",
                    answer:
                      "I focus on all aspects of application and infrastructure performance, including frontend responsiveness, backend efficiency, database optimization, network latency reduction, and infrastructure scalability. My goal is to improve overall system performance, reduce response times, and enhance user experience.",
                  },
                  {
                    question: "How long does the performance optimization process typically take?",
                    answer:
                      "The duration of the optimization process varies depending on the complexity of your system and the scope of improvements needed. A typical engagement might last 4-8 weeks for the initial assessment and implementation of key optimizations. However, I also offer ongoing optimization services to ensure continued performance improvements over time.",
                  },
                  {
                    question: "Can you help with mobile app performance optimization?",
                    answer:
                      "Yes, I have expertise in optimizing both native mobile apps and mobile web applications. My mobile optimization services include improving app launch times, reducing battery consumption, optimizing network requests, and enhancing overall app responsiveness. I use mobile-specific profiling tools and follow best practices for iOS and Android platforms.",
                  },
                  {
                    question: "How do you approach database performance optimization?",
                    answer:
                      "My database optimization approach includes analyzing query performance, optimizing indexing strategies, improving data models, and fine-tuning database configurations. I work with various database systems, including SQL databases like MySQL and PostgreSQL, as well as NoSQL databases like MongoDB. I also implement caching strategies and database sharding when necessary to improve scalability.",
                  },
                  {
                    question: "Do you offer performance optimization for e-commerce platforms?",
                    answer:
                      "Absolutely. I have extensive experience optimizing e-commerce platforms to handle high traffic volumes, especially during peak sales periods. My e-commerce optimization services include improving page load times, optimizing checkout processes, implementing efficient caching strategies, and ensuring seamless integration with payment gateways and inventory management systems.",
                  },
                  {
                    question: "How do you measure the success of performance optimizations?",
                    answer:
                      "I use a variety of metrics to measure the success of my optimizations, including response times, throughput, error rates, and resource utilization. I also focus on business-relevant metrics such as conversion rates, user engagement, and customer satisfaction scores. I implement comprehensive monitoring solutions to track these metrics before, during, and after the optimization process, providing you with clear visibility into the improvements achieved.",
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