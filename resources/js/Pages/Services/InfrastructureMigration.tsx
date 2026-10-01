'use client'

import { ServiceHero } from "@/Components/ServiceHero"
import { Button } from "@/Components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card"
import { ArrowRightLeft, Cloud, Server, ArrowRight, CheckCircle, Users, Database, Shield, Network } from 'lucide-react'
import { Link } from '@inertiajs/react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/Components/ui/accordion"
import { motion } from "framer-motion"
import { useEffect, useRef, useState } from "react"
import { InfiniteScrollTech } from "@/Components/InfiniteScrollTech"
import { getImageUrl } from "@/lib/imageUtils"

const technologies = [
  {
    name: "AWS Migration Hub",
    logo: getImageUrl("/images/logos/migration/aws-migration-hub-logo.svg"),
  },
  {
    name: "Azure Migrate",
    logo: getImageUrl("/images/logos/migration/azure-migrate.png"),
  },
  {
    name: "Google Cloud Migrate",
    logo: getImageUrl("/images/logos/migration/gcp-logo.svg"),
  },
  {
    name: "VMware vSphere",
    logo: getImageUrl("/images/logos/migration/vmware-logo.svg"),
  },
  {
    name: "Terraform",
    logo: getImageUrl("/images/logos/migration/terraform-logo.svg"),
  },
  {
    name: "Ansible",
    logo: getImageUrl("/images/logos/migration/ansible-logo.png"),
  },
  {
    name: "Docker",
    logo: getImageUrl("/images/logos/migration/docker-logo.svg"),
  },
  {
    name: "Kubernetes",
    logo: getImageUrl("/images/logos/migration/kubernetes-logo.svg"),
  },
  {
    name: "CloudEndure Migration",
    logo: getImageUrl("/images/logos/migration/cloudendure-logo.svg"),
  },
  {
    name: "Carbonite Migrate",
    logo: getImageUrl("/images/logos/migration/carbonite-logo.svg"),
  },
  {
    name: "Velostrata",
    logo: getImageUrl("/images/logos/migration/velostrata-logo.svg"),
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

export default function InfrastructureMigration({ canonicalUrl }: { canonicalUrl?: string }) {
  return (
    <>
      <main className="flex flex-col min-h-screen">
        <ServiceHero
          icon={ArrowRightLeft}
          title="Infrastructure Migration"
          description="I move the platform with a plan for downtime, the data, and the first week after cutover."
          backgroundImage="/service-assets/infrastructure-migration/hero.jpg"
        />
        <motion.section className="py-24 bg-white" initial="initial" animate="animate" variants={staggerChildren}>
          <div className="container mx-auto px-4">
            <motion.h2 className="text-3xl font-bold text-center mb-12" variants={fadeInUp}>
              What I do
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
              How I handle Infrastructure Migration
            </motion.h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[
                {
                  title: "Minimal Downtime",
                  content: "My migration strategies are designed to minimize disruption to your business operations.",
                },
                {
                  title: "Comprehensive Planning",
                  content:
                    "I develop detailed migration plans tailored to your specific infrastructure and business needs.",
                },
                {
                  title: "Security-First Approach",
                  content: "I prioritize the security of your data and systems throughout the migration process.",
                },
                {
                  title: "Post-Migration Optimization",
                  content: "I ensure your migrated infrastructure is optimized for performance and cost-efficiency.",
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
                  icon: Server,
                  title: "1. Assessment",
                  content:
                    "I thoroughly assess your current infrastructure and develop a comprehensive migration strategy.",
                },
                {
                  icon: Cloud,
                  title: "2. Planning",
                  content:
                    "I create a detailed migration plan, including timelines, resources, and risk mitigation strategies.",
                },
                {
                  icon: ArrowRightLeft,
                  title: "3. Migration",
                  content:
                    "I execute the migration process, ensuring data integrity and minimal disruption to operations.",
                },
                {
                  icon: Shield,
                  title: "4. Validation & Optimization",
                  content: "I validate the migrated infrastructure and optimize it for performance and cost-efficiency.",
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
              Ready to modernize your infrastructure?
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
                    question: "How long does a typical infrastructure migration take?",
                    answer:
                      "The duration of an infrastructure migration can vary significantly depending on the size and complexity of your current infrastructure, as well as the target environment. A small to medium-sized migration might take a few weeks to a couple of months, while larger, more complex migrations could take several months to a year. I work closely with you to develop a realistic timeline and ensure minimal disruption to your operations throughout the process.",
                  },
                  {
                    question: "How do you ensure data security during the migration process?",
                    answer:
                      "Data security is my top priority during migrations. I implement multiple layers of security measures, including encryption for data in transit and at rest, secure VPN connections, and strict access controls. I also perform thorough security audits before, during, and after the migration process. Additionally, I ensure compliance with relevant industry standards and regulations throughout the migration.",
                  },
                  {
                    question: "Can you migrate our infrastructure to multiple cloud providers?",
                    answer:
                      "Yes, when the move really needs more than one cloud. I plan the split around cost, the failure you cannot accept, and how the two sides talk to each other.",
                  },
                  {
                    question: "How do you handle legacy systems during migration?",
                    answer:
                      "Legacy systems often require special attention during migrations. My approach includes thorough assessment of legacy systems, identifying dependencies, and determining the best migration strategy - whether it's lift-and-shift, re-platforming, or re-architecting. I may use specialized tools for legacy migrations and often implement middleware or APIs to ensure compatibility with modern systems. In some cases, I might recommend phased migration approaches to minimize risk and disruption.",
                  },
                  {
                    question: "What kind of support do you provide post-migration?",
                    answer:
                      "My support doesn't end with the migration. I provide comprehensive post-migration support, including monitoring, optimization, and troubleshooting. I ensure that your team is well-trained on the new infrastructure and can manage day-to-day operations. I also offer ongoing managed services if you prefer to have continuous expert support. My goal is to ensure that you're getting the maximum benefit from your newly migrated infrastructure.",
                  },
                  {
                    question: "How do you minimize downtime during the migration process?",
                    answer:
                      "Minimizing downtime is a critical aspect of my migration strategy. I employ several techniques including parallel environments, data synchronization, incremental migration, off-peak scheduling, automated migration tools, and robust rollback procedures. My goal is to make the transition as seamless as possible, often achieving near-zero downtime for critical systems.",
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