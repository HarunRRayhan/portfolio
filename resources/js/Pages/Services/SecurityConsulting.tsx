'use client'

import { Menubar } from "@/Components/Menubar"
import { Footer } from "@/Components/Footer"
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
import { Link, Head } from '@inertiajs/react'
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
    logo: getImageUrl("/images/logos/security/snort-logo.png"),
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
    logo: getImageUrl("/images/logos/security/aws-securityhub-logo.png"),
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

export default function SecurityConsulting() {
  return (
    <>
      <Head>
        <title>Security Consulting & Implementation Services | Harun R. Rayhan</title>
        <meta name="description" content="Expert security consulting services. Protect your infrastructure and applications with comprehensive security assessments, implementation, and best practices." />
        <meta name="keywords" content="security consulting, cybersecurity, security implementation, cloud security, infrastructure security, security assessment, penetration testing, security best practices" />
        
        {/* OpenGraph Tags */}
        <meta property="og:title" content="Security Consulting & Implementation Services | Harun R. Rayhan" />
        <meta property="og:description" content="Expert security consulting services. Protect your infrastructure and applications with comprehensive security assessments, implementation, and best practices." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={window.location.href} />
        
        {/* Twitter Card Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Security Consulting & Implementation Services | Harun R. Rayhan" />
        <meta name="twitter:description" content="Expert security consulting services. Protect your infrastructure and applications with comprehensive security assessments, implementation, and best practices." />
        
        {/* Canonical URL */}
        <link rel="canonical" href={window.location.href} />

        {/* JSON-LD Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Service",
            "name": "Security Consulting Services",
            "provider": {
              "@type": "Person",
              "name": "Harun R. Rayhan",
              "description": "Security Consulting Expert"
            },
            "serviceType": "Security Services",
            "description": "Expert security consulting and implementation services",
            "offers": {
              "@type": "Offer",
              "description": "Security Assessment, Implementation, Best Practices"
            },
            "hasOfferCatalog": {
              "@type": "OfferCatalog",
              "name": "Security Consulting Services",
              "itemListElement": [
                {
                  "@type": "Offer",
                  "itemOffered": {
                    "@type": "Service",
                    "name": "Security Assessment",
                    "description": "Comprehensive security assessment and vulnerability analysis"
                  }
                },
                {
                  "@type": "Offer",
                  "itemOffered": {
                    "@type": "Service",
                    "name": "Security Implementation",
                    "description": "Implementation of security measures and controls"
                  }
                },
                {
                  "@type": "Offer",
                  "itemOffered": {
                    "@type": "Service",
                    "name": "Security Best Practices",
                    "description": "Implementation of security best practices and standards"
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
          icon={Lock}
          title="Security Consulting"
          description="Protect your cloud infrastructure with comprehensive security assessments and implementation."
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
              Our Security Consulting Services
            </motion.h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: AlertTriangle,
                  title: "Vulnerability Assessment",
                  content:
                    "Identify and prioritize security vulnerabilities in your systems, applications, and infrastructure.",
                },
                {
                  icon: FileSearch,
                  title: "Security Audits",
                  content:
                    "Conduct comprehensive security audits to ensure compliance with industry standards and best practices.",
                },
                {
                  icon: Lock,
                  title: "Security Architecture Design",
                  content:
                    "Design and implement robust security architectures tailored to your organization's needs and risk profile.",
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
              Why Choose Us for Security Consulting
            </motion.h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[
                {
                  title: "Experienced Security Experts",
                  content:
                    "Our team consists of certified security professionals with years of experience in various industries.",
                },
                {
                  title: "Comprehensive Approach",
                  content: "We take a holistic view of security, addressing technical, operational, and human factors.",
                },
                {
                  title: "Cutting-edge Tools and Techniques",
                  content: "We utilize the latest security tools and methodologies to stay ahead of emerging threats.",
                },
                {
                  title: "Tailored Solutions",
                  content:
                    "Our recommendations are customized to your specific business needs, risk profile, and compliance requirements.",
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
              Our Security Consulting Process
            </motion.h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {[
                {
                  icon: Eye,
                  title: "1. Assessment",
                  content:
                    "We conduct a thorough assessment of your current security posture, identifying vulnerabilities and risks.",
                },
                {
                  icon: BarChart,
                  title: "2. Analysis",
                  content:
                    "We analyze the findings and develop a comprehensive security strategy tailored to your needs.",
                },
                {
                  icon: Shield,
                  title: "3. Implementation",
                  content: "We work with you to implement recommended security measures and best practices.",
                },
                {
                  icon: Users,
                  title: "4. Training & Support",
                  content: "We provide ongoing training and support to ensure long-term security effectiveness.",
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
              Ready to enhance your security posture?
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
                    question: "What types of security assessments do you offer?",
                    answer:
                      "We offer a wide range of security assessments, including vulnerability assessments, penetration testing, code reviews, network security assessments, cloud security assessments, and social engineering tests. Our approach is tailored to your specific needs and risk profile.",
                  },
                  {
                    question: "How often should we conduct security assessments?",
                    answer:
                      "The frequency of security assessments depends on various factors, including your industry, regulatory requirements, and risk profile. Generally, we recommend conducting comprehensive assessments at least annually, with more frequent targeted assessments for critical systems or after significant changes to your infrastructure.",
                  },
                  {
                    question: "Can you help with compliance requirements (e.g., GDPR, HIPAA, PCI DSS)?",
                    answer:
                      "Yes, we have extensive experience in helping organizations achieve and maintain compliance with various regulatory standards. Our team is well-versed in GDPR, HIPAA, PCI DSS, ISO 27001, and other industry-specific regulations. We can assist with gap analysis, implementation of required controls, and preparation for audits.",
                  },
                  {
                    question: "How do you handle the security of cloud environments?",
                    answer:
                      "We have expertise in securing cloud environments across major providers like AWS, Azure, and Google Cloud. Our approach includes assessing cloud configurations, implementing security best practices, setting up proper identity and access management, ensuring data encryption, and establishing continuous monitoring. We also assist with cloud-native security tools and services specific to each platform.",
                  },
                  {
                    question: "What's your approach to incident response planning?",
                    answer:
                      "Our incident response planning service involves developing a comprehensive plan tailored to your organization. This includes defining roles and responsibilities, establishing communication protocols, creating incident classification and escalation procedures, and setting up tools for detection and response. We also conduct tabletop exercises to test and refine the plan, ensuring your team is prepared to handle security incidents effectively.",
                  },
                  {
                    question: "How do you stay updated with the latest security threats and technologies?",
                    answer:
                      "Staying current is crucial in the rapidly evolving field of cybersecurity. Our team regularly participates in industry conferences, undergoes continuous training, and maintains various security certifications. We also subscribe to threat intelligence feeds, participate in security communities, and conduct ongoing research to stay ahead of emerging threats and technologies.",
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