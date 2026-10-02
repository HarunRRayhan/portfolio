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
                  title: "The move, with a cutover plan",
                  content:
                    "I move what you run now, usually onto AWS, with a plan for the cutover.",
                },
                {
                  icon: Server,
                  title: "Which room goes away",
                  content: "If two rooms are doing one job, I plan which one goes away and when.",
                },
                {
                  icon: Database,
                  title: "A row check, not a hope",
                  content:
                    "The database moves with a row check, not a hope.",
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
                  title: "A planned window",
                  content: "I name the window before we pick a night.",
                },
                {
                  title: "The first week after",
                  content:
                    "The plan covers downtime, the data, and the first week after cutover.",
                },
                {
                  title: "Who can reach it during the move",
                  content: "The temporary path used for the copy should not stay open afterward.",
                },
                {
                  title: "After cutover",
                  content: "I watch the new side for a week: errors, cost, and the thing that got slower.",
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
                  title: "What moves, and the rollback",
                  content:
                    "I write down what moves, what stays, and how we roll back.",
                },
                {
                  icon: Cloud,
                  title: "The order and the window",
                  content:
                    "You get the order, the window, and what we do if the cutover fails.",
                },
                {
                  icon: ArrowRightLeft,
                  title: "Check the data before traffic",
                  content:
                    "I move it in the window, and check the data before traffic follows.",
                },
                {
                  icon: Shield,
                  title: "The first week",
                  content: "I watch errors and the bill for the first week, and fix what got slower.",
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
              If the platform has to move, plan the first week after cutover.
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
                    question: "How long does a move take?",
                    answer:
                      "A small move is a few weeks. A large one is months. I'll say which after I see what has to move.",
                  },
                  {
                    question: "How do you keep the data safe during the move?",
                    answer:
                      "The copy is encrypted, and the temporary path is closed when the move is done.",
                  },
                  {
                    question: "Can you migrate our infrastructure to multiple cloud providers?",
                    answer:
                      "Yes, when the move really needs more than one cloud. I plan the split around cost, the failure you cannot accept, and how the two sides talk to each other.",
                  },
                  {
                    question: "What happens to the old system?",
                    answer:
                      "I list what it depends on, then we pick a lift-and-shift or a rewrite. I won't rewrite it by default.",
                  },
                  {
                    question: "What happens the week after the move?",
                    answer:
                      "I watch the first week: errors, cost, and what got slower. I don't stay on as a night desk.",
                  },
                  {
                    question: "How long is the system down?",
                    answer:
                      "I name the window and how we roll back. A parallel environment can shrink it. Near zero only if the app can actually do that.",
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