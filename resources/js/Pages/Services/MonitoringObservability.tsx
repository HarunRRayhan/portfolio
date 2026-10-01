'use client'

import { ServiceHero } from "@/Components/ServiceHero"
import { Button } from "@/Components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card"
import { MonitorSmartphone, BarChart, Bell, ArrowRight, CheckCircle, Cloud, GitBranch, Database } from 'lucide-react'
import { Link } from '@inertiajs/react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/Components/ui/accordion"
import { motion } from "framer-motion"
import { useEffect, useRef, useState } from "react"
import { InfiniteScrollTech } from "@/Components/InfiniteScrollTech"
import { getImageUrl } from "@/lib/imageUtils"

const technologies = [
  {
    name: "Prometheus",
    logo: getImageUrl("/images/logos/tech/prometheus-icon-color.svg"),
  },
  {
    name: "Grafana",
    logo: getImageUrl("/images/logos/grafana_logo_swirl_fullcolor.svg"),
  },
  {
    name: "ELK Stack",
    logo: getImageUrl("/images/logos/logo-elastic-outlined-black.svg"),
  },
  {
    name: "Datadog",
    logo: getImageUrl("/images/logos/tech/dd_vertical_purple.png"),
  },
  {
    name: "New Relic",
    logo: getImageUrl("/images/logos/tech/new_relic_logo_vertical.svg"),
  },
  {
    name: "Splunk",
    logo: getImageUrl("/images/logos/tech/splunk-logo.png"),
  },
  {
    name: "Nagios",
    logo: getImageUrl("/images/logos/Nagios-Logo.jpg"),
  },
  {
    name: "Zabbix",
    logo: getImageUrl("/images/logos/tech/zabbix_logo_500x131.png"),
  },
  {
    name: "Jaeger",
    logo: getImageUrl("/images/logos/tech/jaeger-logo.png"),
  },
  {
    name: "Zipkin",
    logo: getImageUrl("/images/logos/zipkin-logo-200x119.jpg"),
  },
  {
    name: "AWS CloudWatch",
    logo: getImageUrl("/images/logos/aws-cloudwatch-logo.svg"),
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

export default function MonitoringObservability({ canonicalUrl }: { canonicalUrl?: string }) {
  return (
    <>
      <main className="flex flex-col min-h-screen">
        <ServiceHero
          icon={BarChart}
          title="Monitoring & Observability"
          description="Metrics, logs, and traces, so you hear about a failure before your users do."
          backgroundImage="/service-assets/monitoring-observability/hero.jpg"
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
                  icon: MonitorSmartphone,
                  title: "Infrastructure Monitoring",
                  content:
                    "I put metrics on the hosts, the app, and the cloud services you already run.",
                },
                {
                  icon: BarChart,
                  title: "Application Performance Monitoring",
                  content:
                    "I trace the slow request so you can see which call ate the time.",
                },
                {
                  icon: Bell,
                  title: "Alerting and Incident Response",
                  content:
                    "An alarm should reach the person who can fix it, and it should not fire all day.",
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
                  title: "The whole path",
                  content:
                    "Host, app, and the dependency in between. A green dashboard that hides the failure is useless.",
                },
                {
                  title: "A dashboard you will open",
                  content:
                    "I put the few graphs you'd check during an incident on one screen.",
                },
                {
                  title: "Page before the users do",
                  content:
                    "The alarm fires on the thing that breaks the app, not on every CPU twitch.",
                },
                {
                  title: "After the graphs exist",
                  content: "Once the graphs exist, the slow path and the wasted capacity are easier to see.",
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
                  icon: MonitorSmartphone,
                  title: "1. Assessment",
                  content:
                    "I look at what you can already see, and what fails silently.",
                },
                {
                  icon: Cloud,
                  title: "2. Design",
                  content:
                    "You get the metrics, the logs, and which alarm pages a person.",
                },
                {
                  icon: GitBranch,
                  title: "3. Implementation",
                  content:
                    "I install it, build the dashboard, and send a test page.",
                },
                {
                  icon: BarChart,
                  title: "4. Optimization",
                  content:
                    "I tune the noisy alarms before I add more graphs.",
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
              If users hear about a failure before you do, start there.
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
                    question: "What's the difference between monitoring and observability?",
                    answer:
                      "While monitoring and observability are related, they serve different purposes. Monitoring typically involves tracking predefined sets of metrics and logs to understand the health and performance of systems. Observability, on the other hand, goes a step further by providing deeper insights into the internal states of systems based on the data they generate. It allows you to understand and debug complex systems, even when facing unforeseen issues.",
                  },
                  {
                    question: "What tools do you use for monitoring and observability?",
                    answer:
                      "I use a variety of tools depending on the specific needs and existing infrastructure of each client. Some common tools I work with include Prometheus, Grafana, ELK stack (Elasticsearch, Logstash, Kibana), Datadog, New Relic, and cloud-native solutions like AWS CloudWatch or Google Cloud's operations suite. I can also integrate with existing tools you may already be using.",
                  },
                  {
                    question: "How can improved monitoring and observability benefit my business?",
                    answer:
                      "Improved monitoring and observability can significantly benefit your business by providing real-time insights into your systems' performance and health. This leads to faster problem detection and resolution, reduced downtime, improved user experience, and more efficient resource utilization. It also enables data-driven decision making and can help in capacity planning and cost optimization.",
                  },
                  {
                    question: "Can you help with setting up custom dashboards and alerts?",
                    answer:
                      "Yes, I specialize in creating custom dashboards and alert systems tailored to your specific needs. I work closely with your team to understand what metrics and indicators are most important for your business, and then design intuitive, informative dashboards to visualize this data. I also set up intelligent alerting systems that can notify the right people at the right time, helping to minimize false alarms and ensure quick responses to real issues.",
                  },
                  {
                    question: "How do you handle monitoring for microservices architectures?",
                    answer:
                      "Monitoring microservices architectures requires a specialized approach due to their distributed nature. I implement distributed tracing to track requests across multiple services, use service meshes for improved visibility, and set up centralized logging and monitoring solutions. I also focus on implementing effective health checks, dependency mapping, and anomaly detection to ensure the overall health and performance of your microservices ecosystem.",
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