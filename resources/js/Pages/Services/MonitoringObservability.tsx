'use client'

import { Menubar } from "@/Components/Menubar"
import { Footer } from "@/Components/Footer"
import { ServiceHero } from "@/Components/ServiceHero"
import { Button } from "@/Components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card"
import { MonitorSmartphone, BarChart, Bell, ArrowRight, CheckCircle, Cloud, GitBranch, Database } from 'lucide-react'
import { Link } from '@inertiajs/react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/Components/ui/accordion"
import { motion } from "framer-motion"
import { useEffect, useRef, useState } from "react"
import { InfiniteScrollTech } from "@/Components/InfiniteScrollTech"

const technologies = [
  {
    name: "Prometheus",
    logo: "https://raw.githubusercontent.com/cncf/artwork/master/projects/prometheus/icon/color/prometheus-icon-color.svg",
  },
  {
    name: "Grafana",
    logo: "https://grafana.com/static/img/logos/grafana_logo_swirl_fullcolor.svg",
  },
  {
    name: "ELK Stack",
    logo: "https://static-www.elastic.co/v3/assets/bltefdd0b53724fa2ce/blt36f2da8d650732a0/5d0823c3d8ff351753cbc99f/logo-elastic-outlined-black.svg",
  },
  {
    name: "Datadog",
    logo: "https://imgix.datadoghq.com/img/about/presskit/logo-v/dd_vertical_purple.png",
  },
  {
    name: "New Relic",
    logo: "https://newrelic.com/themes/custom/erno/assets/mediakit/new_relic_logo_vertical.svg",
  },
  {
    name: "Splunk",
    logo: "https://www.splunk.com/content/dam/splunk-blogs/images/2017/02/splunk-logo.png",
  },
  {
    name: "Nagios",
    logo: "https://www.nagios.org/wp-content/uploads/2015/05/Nagios-Logo.jpg",
  },
  {
    name: "Zabbix",
    logo: "https://assets.zabbix.com/img/logo/zabbix_logo_500x131.png",
  },
  {
    name: "Jaeger",
    logo: "https://www.jaegertracing.io/img/jaeger-logo.png",
  },
  {
    name: "Zipkin",
    logo: "https://zipkin.io/public/img/zipkin-logo-200x119.jpg",
  },
  {
    name: "AWS CloudWatch",
    logo: "https://d1.awsstatic.com/icons/aws-icons/AWS-CloudWatch_icon_64_Squid.4c65a3d318a1e2c52a77f4f60b336430c9d7294a.png",
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

export default function MonitoringObservability() {
  return (
    <main className="flex flex-col min-h-screen">
      <Menubar />
      <ServiceHero
        icon={BarChart}
        title="Monitoring & Observability"
        description="Implement comprehensive monitoring solutions to gain deep insights into your infrastructure and applications."
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
            Our Monitoring and Observability Services
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: MonitorSmartphone,
                title: "Infrastructure Monitoring",
                content:
                  "Implement comprehensive monitoring solutions for your entire infrastructure, from servers to cloud services.",
              },
              {
                icon: BarChart,
                title: "Application Performance Monitoring",
                content:
                  "Set up detailed application performance monitoring to track and optimize your software's performance.",
              },
              {
                icon: Bell,
                title: "Alerting and Incident Response",
                content:
                  "Develop robust alerting systems and incident response processes to quickly address issues as they arise.",
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
            Why Choose Us for Monitoring and Observability
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                title: "Holistic Approach",
                content:
                  "We provide end-to-end monitoring solutions that cover your entire stack, from infrastructure to applications.",
              },
              {
                title: "Custom Dashboards",
                content:
                  "We create tailored dashboards that give you instant visibility into the metrics that matter most to your business.",
              },
              {
                title: "Proactive Issue Detection",
                content:
                  "Our advanced alerting systems help you catch and resolve issues before they impact your users.",
              },
              {
                title: "Continuous Improvement",
                content: "We help you leverage monitoring data to continuously optimize your systems and processes.",
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
            Our Monitoring and Observability Process
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              {
                icon: MonitorSmartphone,
                title: "1. Assessment",
                content:
                  "We evaluate your current monitoring setup and identify areas for improvement and coverage gaps.",
              },
              {
                icon: Cloud,
                title: "2. Design",
                content:
                  "We design a comprehensive monitoring and observability strategy tailored to your specific needs.",
              },
              {
                icon: GitBranch,
                title: "3. Implementation",
                content:
                  "We set up and configure monitoring tools, create custom dashboards, and implement alerting systems.",
              },
              {
                icon: BarChart,
                title: "4. Optimization",
                content:
                  "We continuously refine your monitoring setup, adjusting thresholds and adding new metrics as needed.",
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
            Ready to enhance your monitoring and observability?
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
                  question: "What's the difference between monitoring and observability?",
                  answer:
                    "While monitoring and observability are related, they serve different purposes. Monitoring typically involves tracking predefined sets of metrics and logs to understand the health and performance of systems. Observability, on the other hand, goes a step further by providing deeper insights into the internal states of systems based on the data they generate. It allows you to understand and debug complex systems, even when facing unforeseen issues.",
                },
                {
                  question: "What tools do you use for monitoring and observability?",
                  answer:
                    "We use a variety of tools depending on the specific needs and existing infrastructure of each client. Some common tools we work with include Prometheus, Grafana, ELK stack (Elasticsearch, Logstash, Kibana), Datadog, New Relic, and cloud-native solutions like AWS CloudWatch or Google Cloud's operations suite. We can also integrate with existing tools you may already be using.",
                },
                {
                  question: "How can improved monitoring and observability benefit my business?",
                  answer:
                    "Improved monitoring and observability can significantly benefit your business by providing real-time insights into your systems' performance and health. This leads to faster problem detection and resolution, reduced downtime, improved user experience, and more efficient resource utilization. It also enables data-driven decision making and can help in capacity planning and cost optimization.",
                },
                {
                  question: "Can you help with setting up custom dashboards and alerts?",
                  answer:
                    "Yes, we specialize in creating custom dashboards and alert systems tailored to your specific needs. We work closely with your team to understand what metrics and indicators are most important for your business, and then design intuitive, informative dashboards to visualize this data. We also set up intelligent alerting systems that can notify the right people at the right time, helping to minimize false alarms and ensure quick responses to real issues.",
                },
                {
                  question: "How do you handle monitoring for microservices architectures?",
                  answer:
                    "Monitoring microservices architectures requires a specialized approach due to their distributed nature. We implement distributed tracing to track requests across multiple services, use service meshes for improved visibility, and set up centralized logging and monitoring solutions. We also focus on implementing effective health checks, dependency mapping, and anomaly detection to ensure the overall health and performance of your microservices ecosystem.",
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