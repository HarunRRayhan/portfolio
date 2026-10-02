'use client'

import { ServiceHero } from "@/Components/ServiceHero"
import { Button } from "@/Components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card"
import {
  Database,
  ArrowRightLeft,
  Shield,
  ArrowRight,
  CheckCircle,
  Users,
  Cloud,
  GitBranch,
  BarChart,
} from 'lucide-react'
import { Link } from '@inertiajs/react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/Components/ui/accordion"
import { motion } from "framer-motion"
import { useEffect, useRef, useState } from "react"
import { InfiniteScrollTech } from "@/Components/InfiniteScrollTech"
import { getImageUrl } from "@/lib/imageUtils"

const technologies = [
  { name: "MySQL", logo: getImageUrl("/images/logos/db/mysql-logo.svg") },
  { name: "PostgreSQL", logo: getImageUrl("/images/logos/db/postgresql-logo.png") },
  { name: "MongoDB", logo: getImageUrl("/images/logos/db/mongodb-logo.png") },
  { name: "Oracle", logo: getImageUrl("/images/logos/db/oracle-logo.svg") },
  { name: "Microsoft SQL Server", logo: getImageUrl("/images/logos/db/sqlserver-logo.png") },
  {
    name: "Amazon RDS",
    logo: getImageUrl("/images/logos/db/aws-rds-logo.svg"),
  },
  {
    name: "Google Cloud SQL",
    logo: getImageUrl("/images/logos/db/gcp-logo.svg"),
  },
  {
    name: "Azure SQL Database",
    logo: getImageUrl("/images/logos/db/azure-logo.svg"),
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

export default function DatabaseMigration({ canonicalUrl }: { canonicalUrl?: string }) {
  return (
    <>
      <main className="flex flex-col min-h-screen">
        <ServiceHero
          icon={Database}
          title="Database Migration"
          description="I move the database and check the data on both sides before anything goes live."
          backgroundImage="/service-assets/database-migration/hero.jpg"
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
                  icon: Database,
                  title: "Size and downtime",
                  content:
                    "I map the schema, the size, and how long you can be offline.",
                },
                {
                  icon: ArrowRightLeft,
                  title: "Copy, check, cut over",
                  content:
                    "I copy the data, check the rows on both sides, then cut over.",
                },
                {
                  icon: Shield,
                  title: "The queries that got slower",
                  content:
                    "After cutover I watch the new database for the queries that got slower.",
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
                  title: "Check both sides",
                  content:
                    "I move MySQL, PostgreSQL, and the managed databases people usually mean, and I check the rows on both sides before cutover.",
                },
                {
                  title: "A planned window",
                  content: "I say how long the window is before we pick a night.",
                },
                {
                  title: "The row counts",
                  content:
                    "I compare counts and checksums before anything points at the new database.",
                },
                {
                  title: "The new database has to be fast enough",
                  content:
                    "I check the slow queries on the new side before you call it done.",
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
                  icon: Database,
                  title: "Size, downtime, rollback",
                  content: "I write down the size, the downtime, and how we roll back.",
                },
                {
                  icon: Cloud,
                  title: "Test the copy first",
                  content: "The new database is up, and the copy tool is tested on a slice of the data.",
                },
                {
                  icon: ArrowRightLeft,
                  title: "The window we agreed",
                  content: "I run the copy, then the cutover, in the window we agreed.",
                },
                {
                  icon: BarChart,
                  title: "Rows, then the slow queries",
                  content:
                    "I check the rows, then the queries that matter, before I call it done.",
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
              If the database has to move, plan the cutover first.
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
                    question: "When is a database move worth it?",
                    answer:
                      "When the current database is slow, expensive, or missing something you actually need. I won't move it just to be on something newer.",
                  },
                  {
                    question: "How do you know the data made it?",
                    answer:
                      "I compare counts and checksums on both sides before traffic points at the new database. If they don't match, it doesn't cut over.",
                  },
                  {
                    question: "How long is the database down?",
                    answer:
                      "I name the window. Replication can shrink it. If some downtime is required, we pick a quiet hour.",
                  },
                  {
                    question: "Can you move from one database type to another?",
                    answer:
                      "Yes, including from one relational database to another, or over to something else. The schema change is planned and tested before the real copy.",
                  },
                  {
                    question: "What about a very large database?",
                    answer:
                      "I copy in slices, not one giant transfer, and I watch the new database under load before you call it done.",
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