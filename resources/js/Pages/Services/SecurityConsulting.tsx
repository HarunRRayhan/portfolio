'use client'

import { ServiceHero } from "@/Components/ServiceHero"
import { Button } from "@/Components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card"
import {
  Shield,
  Lock,
  Eye,
  ArrowRight,
  CheckCircle,
  BarChart,
  Users,
  AlertTriangle,
  FileSearch,
} from 'lucide-react'
import { Link } from '@inertiajs/react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/Components/ui/accordion"
import { motion } from "framer-motion"
import { useEffect, useRef, useState } from "react"
import { InfiniteScrollTech } from "@/Components/InfiniteScrollTech"
import { getImageUrl } from "@/lib/imageUtils"

const technologies = [
  {
    name: "Nessus",
    logo: getImageUrl("/images/logos/security/nessus-logo.svg"),
  },
  {
    name: "Qualys",
    logo: getImageUrl("/images/logos/security/qualys-logo.svg"),
  },
  {
    name: "Metasploit",
    logo: getImageUrl("/images/logos/security/metasploit-logo.svg"),
  },
  {
    name: "Wireshark",
    logo: getImageUrl("/images/logos/security/wireshark-logo.png"),
  },
  {
    name: "Burp Suite",
    logo: getImageUrl("/images/logos/security/burpsuite-logo.svg"),
  },
  {
    name: "OWASP ZAP",
    logo: getImageUrl("/images/logos/security/zap-logo.svg"),
  },
  {
    name: "Snort",
    logo: getImageUrl("/images/logos/security/snort-logo.svg"),
  },
  {
    name: "Splunk",
    logo: getImageUrl("/images/logos/security/splunk-logo.png"),
  },
  {
    name: "Kali Linux",
    logo: getImageUrl("/images/logos/security/kali-logo.svg"),
  },
  {
    name: "AWS Security Hub",
    logo: getImageUrl("/images/logos/security/aws-securityhub-logo.svg"),
  },
  {
    name: "Azure Security Center",
    logo: getImageUrl("/images/logos/security/azure-security-center-logo.png"),
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

export default function SecurityConsulting({ canonicalUrl }: { canonicalUrl?: string }) {
  return (
    <>
      <main className="flex flex-col min-h-screen">
        <ServiceHero
          icon={Lock}
          title="Security Consulting"
          description="I look at IAM, network boundaries, and the logs, then close the paths that are wider than the job."
          backgroundImage="/service-assets/security-consulting/hero.jpg"
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
                  icon: AlertTriangle,
                  title: "Vulnerability Assessment",
                  content:
                    "I list what's exposed, and which of those a stranger could actually use.",
                },
                {
                  icon: FileSearch,
                  title: "Security Audits",
                  content:
                    "I compare the account to the control an audit will ask about, and say what's missing.",
                },
                {
                  icon: Lock,
                  title: "Security Architecture Design",
                  content:
                    "I change IAM, the network, and the logs. I don't add a product for its own sake.",
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
                  title: "IAM, network, logs",
                  content:
                    "I look at IAM, the network, and the logs, then tell you which path is wider than the job.",
                },
                {
                  title: "The path, not the poster",
                  content: "I look at the permission, the network rule, and who gets paged.",
                },
                {
                  title: "The tools that fit",
                  content: "I use the scanner and the logs you can already run. A new tool has to earn it.",
                },
                {
                  title: "What to close first",
                  content:
                    "The list is what to close first, not every finding the scanner printed.",
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
                  icon: Eye,
                  title: "1. Assessment",
                  content:
                    "I look at IAM, the network, and the logs, and write down the wide paths.",
                },
                {
                  icon: BarChart,
                  title: "2. Analysis",
                  content:
                    "You get a short list, ordered by what a stranger could use.",
                },
                {
                  icon: Shield,
                  title: "3. Implementation",
                  content: "I make the changes we agreed, in the account, and show you the diff.",
                },
                {
                  icon: Users,
                  title: "4. Training & Support",
                  content: "I leave notes your team can follow the next time someone needs access.",
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
              If a path is wider than the job, close it.
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
                    question: "What types of security assessments do you offer?",
                    answer:
                      "I review the cloud account, the network, and the app, and I run a vulnerability scan. If you need a full penetration test, I'll say whether that's the right job.",
                  },
                  {
                    question: "How often should we conduct security assessments?",
                    answer:
                      "After a big change, and at least once a year if an auditor expects it. Critical systems more often.",
                  },
                  {
                    question: "Can you help with compliance requirements (e.g., GDPR, HIPAA, PCI DSS)?",
                    answer:
                      "I can help with the controls and the evidence an audit will ask for, including GDPR, HIPAA, PCI DSS, and ISO 27001. I will tell you if a control is missing instead of papering over it.",
                  },
                  {
                    question: "How do you handle the security of cloud environments?",
                    answer:
                      "Mostly AWS. I read the account config, IAM, encryption, and the logs.",
                  },
                  {
                    question: "What's your approach to incident response planning?",
                    answer:
                      "Who gets called, how you tell it's real, and a short practice run. A binder nobody opens doesn't count.",
                  },
                  {
                    question: "How do you stay updated with the latest security threats and technologies?",
                    answer:
                      "I keep up by reading the incidents, the vendor notes, and the certifications I actually hold. If a new issue matters to your stack, it goes in the review.",
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