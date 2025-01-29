'use client'

import { Menubar } from "@/Components/Menubar"
import { Footer } from "@/Components/Footer"
import { ServiceHero } from "@/Components/ServiceHero"
import { Button } from "@/Components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card"
import { ArrowRightLeft, Cloud, Server, ArrowRight, CheckCircle, Users, Database, Shield, Network } from 'lucide-react'
import { Link } from '@inertiajs/react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/Components/ui/accordion"
import { motion } from "framer-motion"
import { useEffect, useRef, useState } from "react"
import { InfiniteScrollTech } from "@/Components/InfiniteScrollTech"

const technologies = [
  {
    name: "AWS Migration Hub",
    logo: "https://d1.awsstatic.com/icons/aws-icons/AWS-Migration-Hub_icon_64_squid.3cea7d6a3d2c3c0c0d4bfb3c6d0e3e0e.png",
  },
  {
    name: "Azure Migrate",
    logo: "https://azure.microsoft.com/svghandler/migrate/?width=300&height=300",
  },
  {
    name: "Google Cloud Migrate",
    logo: "https://www.gstatic.com/devrel-devsite/prod/v2210075187f059b839246c2c03840474501c3c6024a99fb78f6293c1b4c0f664/cloud/images/cloud-logo.svg",
  },
  {
    name: "VMware vSphere",
    logo: "https://www.vmware.com/content/dam/digitalmarketing/vmware/en/images/company/vmware-logo-grey.svg",
  },
  {
    name: "Terraform",
    logo: "https://www.terraform.io/img/logo-hashicorp.svg",
  },
  {
    name: "Ansible",
    logo: "https://www.ansible.com/hubfs/2016_Images/Assets/Ansible-Mark-Large-RGB-Mango.png",
  },
  {
    name: "Docker",
    logo: "https://www.docker.com/sites/default/files/d8/2019-07/vertical-logo-monochromatic.png",
  },
  {
    name: "Kubernetes",
    logo: "https://kubernetes.io/images/favicon.png",
  },
  {
    name: "CloudEndure Migration",
    logo: "https://d1.awsstatic.com/product-marketing/CloudEndure/CloudEndure_logo_light.3a2fddd4fb1aef9c41c14e0bd52de4ef4b9b15a7.png",
  },
  {
    name: "Carbonite Migrate",
    logo: "https://www.carbonite.com/globalassets/images/logos/carbonite-logo-2020.svg",
  },
  {
    name: "Velostrata",
    logo: "https://velostrata.com/wp-content/themes/velostrata/images/logo.png",
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

export default function InfrastructureMigration() {
  return (
    <main className="flex flex-col min-h-screen">
      <Menubar />
      <ServiceHero
        icon={ArrowRightLeft}
        title="Infrastructure Migration"
        description="Seamlessly migrate your infrastructure to modern, scalable platforms with minimal downtime."
      />
      <motion.section className="py-24 bg-white" initial="initial" animate="animate" variants={staggerChildren}>
        <div className="container mx-auto px-4">
          <motion.h2 className="text-3xl font-bold text-center mb-12" variants={fadeInUp}>
            Our Infrastructure Migration Services
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Cloud,
                title: "Cloud Migration",
                content:
                  "Migrate your on-premises infrastructure to leading cloud platforms like AWS, Azure, or Google Cloud.",
              },
              {
                icon: Server,
                title: "Data Center Consolidation",
                content: "Streamline your data centers, reducing costs and improving operational efficiency.",
              },
              {
                icon: Database,
                title: "Database Migration",
                content:
                  "Seamlessly transfer your databases to modern, scalable platforms while ensuring data integrity.",
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
            Why Choose Us for Infrastructure Migration
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                title: "Minimal Downtime",
                content: "Our migration strategies are designed to minimize disruption to your business operations.",
              },
              {
                title: "Comprehensive Planning",
                content:
                  "We develop detailed migration plans tailored to your specific infrastructure and business needs.",
              },
              {
                title: "Security-First Approach",
                content: "We prioritize the security of your data and systems throughout the migration process.",
              },
              {
                title: "Post-Migration Optimization",
                content: "We ensure your migrated infrastructure is optimized for performance and cost-efficiency.",
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
            Our Infrastructure Migration Process
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              {
                icon: Server,
                title: "1. Assessment",
                content:
                  "We thoroughly assess your current infrastructure and develop a comprehensive migration strategy.",
              },
              {
                icon: Cloud,
                title: "2. Planning",
                content:
                  "We create a detailed migration plan, including timelines, resources, and risk mitigation strategies.",
              },
              {
                icon: ArrowRightLeft,
                title: "3. Migration",
                content:
                  "We execute the migration process, ensuring data integrity and minimal disruption to operations.",
              },
              {
                icon: Shield,
                title: "4. Validation & Optimization",
                content: "We validate the migrated infrastructure and optimize it for performance and cost-efficiency.",
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
            Ready to modernize your infrastructure?
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
                  question: "How long does a typical infrastructure migration take?",
                  answer:
                    "The duration of an infrastructure migration can vary significantly depending on the size and complexity of your current infrastructure, as well as the target environment. A small to medium-sized migration might take a few weeks to a couple of months, while larger, more complex migrations could take several months to a year. We work closely with you to develop a realistic timeline and ensure minimal disruption to your operations throughout the process.",
                },
                {
                  question: "How do you ensure data security during the migration process?",
                  answer:
                    "Data security is our top priority during migrations. We implement multiple layers of security measures, including encryption for data in transit and at rest, secure VPN connections, and strict access controls. We also perform thorough security audits before, during, and after the migration process. Additionally, we ensure compliance with relevant industry standards and regulations throughout the migration.",
                },
                {
                  question: "Can you migrate our infrastructure to multiple cloud providers?",
                  answer:
                    "Yes, we have expertise in multi-cloud migrations. We can help you distribute your infrastructure across multiple cloud providers to optimize for cost, performance, and redundancy. Our team is well-versed in the nuances of different cloud platforms and can design a migration strategy that leverages the strengths of each provider while ensuring interoperability and efficient management.",
                },
                {
                  question: "How do you handle legacy systems during migration?",
                  answer:
                    "Legacy systems often require special attention during migrations. Our approach includes thorough assessment of legacy systems, identifying dependencies, and determining the best migration strategy - whether it's lift-and-shift, re-platforming, or re-architecting. We may use specialized tools for legacy migrations and often implement middleware or APIs to ensure compatibility with modern systems. In some cases, we might recommend phased migration approaches to minimize risk and disruption.",
                },
                {
                  question: "What kind of support do you provide post-migration?",
                  answer:
                    "Our support doesn't end with the migration. We provide comprehensive post-migration support, including monitoring, optimization, and troubleshooting. We ensure that your team is well-trained on the new infrastructure and can manage day-to-day operations. We also offer ongoing managed services if you prefer to have continuous expert support. Our goal is to ensure that you're getting the maximum benefit from your newly migrated infrastructure.",
                },
                {
                  question: "How do you minimize downtime during the migration process?",
                  answer:
                    "Minimizing downtime is a critical aspect of our migration strategy. We employ several techniques including parallel environments, data synchronization, incremental migration, off-peak scheduling, automated migration tools, and robust rollback procedures. Our goal is to make the transition as seamless as possible, often achieving near-zero downtime for critical systems.",
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