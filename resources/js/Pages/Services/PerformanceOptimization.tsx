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
                  title: "The slow request",
                  content:
                    "I find the slow request and fix that path: code, query, or both.",
                },
                {
                  icon: Cloud,
                  title: "Capacity after the slow path",
                  content:
                    "I add capacity only after the slow path is fixed. Extra servers hide a bad query.",
                },
                {
                  icon: BarChart,
                  title: "A number before and after",
                  content:
                    "I measure before and after, so the change has a number on it.",
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
              What you get
            </motion.h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[
                {
                  title: "The whole path",
                  content:
                    "Frontend, the app, the database. I start where the time actually goes.",
                },
                {
                  title: "A trace, not a hunch",
                  content: "I don't guess. I read the trace.",
                },
                {
                  title: "Headroom you can name",
                  content: "I say what the current path can take, and what breaks first when traffic doubles.",
                },
                {
                  title: "A number you can watch",
                  content:
                    "I leave the graph in place so the next slowdown is visible.",
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
                  title: "Measure the slow path",
                  content: "I measure the slow path under load that looks like yours.",
                },
                {
                  icon: Code,
                  title: "Ordered by time saved",
                  content: "You get a short list, ordered by how much time it gives back.",
                },
                {
                  icon: Zap,
                  title: "The slowest thing first",
                  content: "I change the slowest thing first, then measure again.",
                },
                {
                  icon: Users,
                  title: "A dashboard that stays",
                  content:
                    "I leave the dashboard so you can see if it stays fast.",
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
              If it's slow, measure the path before you add capacity.
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
              Questions people ask
            </motion.h2>
            <motion.div variants={fadeInUp}>
              <Accordion type="single" collapsible className="max-w-3xl mx-auto">
                {[
                  {
                    question: "Where do you start when something is slow?",
                    answer:
                      "The slow request. That might be the front end, the app, the database, or the network. I start where the time goes.",
                  },
                  {
                    question: "How long does a performance pass take?",
                    answer:
                      "Often a few weeks for the slow paths. I measure again before talking about more work.",
                  },
                  {
                    question: "Can you look at a slow mobile app?",
                    answer:
                      "I can look at a slow start and chatty network calls. If it's a native problem I don't know, I'll say so.",
                  },
                  {
                    question: "What if the database is the slow part?",
                    answer:
                      "Slow queries, indexes, and caching. MySQL, PostgreSQL, or MongoDB if that's what you run.",
                  },
                  {
                    question: "Can you look at a slow checkout?",
                    answer:
                      "Same measurement. Checkout and the catalog under load, including a sale spike if that's the failure you care about.",
                  },
                  {
                    question: "How do you tell if it got faster?",
                    answer:
                      "Response time and error rate, before and after. If you care about conversion, we look at that too.",
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