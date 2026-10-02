'use client'

import { ServiceHero } from "@/Components/ServiceHero"
import { Button } from "@/Components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card"
import { Database, Zap, Lock, ArrowRight, CheckCircle, BarChart, Users, GitBranch, Cloud } from 'lucide-react'
import { Link } from '@inertiajs/react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/Components/ui/accordion"
import { motion } from "framer-motion"
import { useEffect, useRef, useState } from "react"
import { InfiniteScrollTech } from "@/Components/InfiniteScrollTech"
import { getImageUrl } from "@/lib/imageUtils"

const technologies = [
  {
    name: "MySQL",
    logo: getImageUrl("/images/logos/tech/mysql-logo.svg"),
  },
  {
    name: "PostgreSQL",
    logo: getImageUrl("/images/logos/db/elephant.png"),
  },
  {
    name: "MongoDB",
    logo: getImageUrl("/images/logos/db/leaf.png"),
  },
  {
    name: "Oracle",
    logo: getImageUrl("/images/logos/tech/oracle-logo.svg"),
  },
  {
    name: "Microsoft SQL Server",
    logo: getImageUrl("/images/logos/db/sql-server-logo.png"),
  },
  {
    name: "Redis",
    logo: getImageUrl("/images/logos/tech/redis-logo.svg"),
  },
  {
    name: "Elasticsearch",
    logo: getImageUrl("/images/logos/logo-elastic-outlined-black.svg"),
  },
  {
    name: "Cassandra",
    logo: getImageUrl("/images/logos/tech/cassandra_logo.svg"),
  },
  {
    name: "Amazon RDS",
    logo: getImageUrl("/images/logos/tech/aws-rds-logo.svg"),
  },
  {
    name: "Google Cloud SQL",
    logo: getImageUrl("/images/logos/tech/cloud-logo.svg"),
  },
  {
    name: "Azure SQL Database",
    logo: getImageUrl("/images/logos/cloud/azure.svg"),
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

export default function DatabaseOptimization({ canonicalUrl }: { canonicalUrl?: string }) {
  return (
    <>
      <main className="flex flex-col min-h-screen">
        <ServiceHero
          icon={Database}
          title="Database Optimization"
          description="Slow queries, missing indexes, and connection limits. I fix the ones that show up under real load."
          backgroundImage="/service-assets/database-optimization/hero.jpg"
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
                  icon: Zap,
                  title: "Performance Tuning",
                  content:
                    "I fix the queries, indexes, and connection limits that show up under real load.",
                },
                {
                  icon: Lock,
                  title: "Security Enhancement",
                  content:
                    "I look at who can reach the database, and close the accounts that don't need to.",
                },
                {
                  icon: Database,
                  title: "Scalability Planning",
                  content:
                    "I plan for more rows and more connections before the database is the outage.",
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
                  title: "The database you already run",
                  content:
                    "I work with MySQL, PostgreSQL, and the usual managed databases, and I start from the queries you actually run.",
                },
                {
                  title: "The slow query, not a guess",
                  content:
                    "I start from the queries that are actually slow, not from a checklist.",
                },
                {
                  title: "The query and the app around it",
                  content:
                    "A missing index and an N+1 in the app are different fixes. I check both.",
                },
                {
                  title: "A number you can watch",
                  content:
                    "I leave a way to see the slow queries after I leave.",
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
                  content:
                    "I look at the slow log, the locks, and the connection count.",
                },
                {
                  icon: GitBranch,
                  title: "2. Strategy Development",
                  content:
                    "You get a short list, ordered by what hurts users first.",
                },
                {
                  icon: Database,
                  title: "3. Implementation",
                  content: "I change one thing at a time and watch the query time.",
                },
                {
                  icon: Cloud,
                  title: "4. Monitoring & Refinement",
                  content:
                    "I leave the slow-query view in place so the next regression is obvious.",
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
              If the database is the slow part, start there.
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
                    question: "How do I know the database is the problem?",
                    answer:
                      "Slow queries, timeouts, and a CPU graph that's pegged. If the app feels slow and the database is the wait, that's the sign.",
                  },
                  {
                    question: "What gets better when the database is faster?",
                    answer:
                      "Pages get faster, and you stop paying for a bigger database that a missing index would have fixed.",
                  },
                  {
                    question: "Do you work with SQL and NoSQL?",
                    answer:
                      "Yes. I work with MySQL, PostgreSQL, and SQL Server, and with MongoDB and Redis when those are what you already run. The fix depends on which one is slow.",
                  },
                  {
                    question: "Will the data stay intact?",
                    answer:
                      "I try the change in staging first, and I take a backup before anything that rewrites data.",
                  },
                  {
                    question: "Can you do this on a cloud database?",
                    answer:
                      "Yes. On AWS, and on Google Cloud or Azure if that's where it already runs.",
                  },
                  {
                    question: "How long does a database pass take?",
                    answer:
                      "A few days for the obvious queries. A few weeks if the schema itself is the problem.",
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