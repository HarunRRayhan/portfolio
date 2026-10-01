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
                    "Optimize queries, indexes, and database configurations to significantly improve response times.",
                },
                {
                  icon: Lock,
                  title: "Security Enhancement",
                  content:
                    "Implement robust security measures to protect your data from unauthorized access and potential threats.",
                },
                {
                  icon: Database,
                  title: "Scalability Planning",
                  content:
                    "Design and implement strategies to ensure your database can handle growing data volumes and user loads.",
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
              How I handle Database Optimization
            </motion.h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[
                {
                  title: "Expertise Across Database Systems",
                  content:
                    "I work with MySQL, PostgreSQL, and the usual managed databases, and I start from the queries you actually run.",
                },
                {
                  title: "Data-Driven Approach",
                  content:
                    "I use advanced analytics and monitoring tools to identify bottlenecks and optimize based on real usage patterns.",
                },
                {
                  title: "Holistic Optimization",
                  content:
                    "I consider all aspects of your database ecosystem, including hardware, software, and application layers.",
                },
                {
                  title: "Continuous Improvement",
                  content:
                    "I implement ongoing monitoring and optimization processes to ensure sustained performance over time.",
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
                    "I thoroughly analyze your current database performance, identifying bottlenecks and areas for improvement.",
                },
                {
                  icon: GitBranch,
                  title: "2. Strategy Development",
                  content:
                    "I create a tailored optimization plan based on my assessment and your specific business needs.",
                },
                {
                  icon: Database,
                  title: "3. Implementation",
                  content: "I execute the optimization strategies, carefully monitoring the impact on your system.",
                },
                {
                  icon: Cloud,
                  title: "4. Monitoring & Refinement",
                  content:
                    "I set up ongoing monitoring and continuously refine my optimizations to ensure sustained performance.",
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
              Ready to optimize your database performance?
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
                    question: "What are the signs that my database needs optimization?",
                    answer:
                      "Common signs include slow query performance, high CPU or memory usage, frequent timeouts, and difficulty scaling to meet growing demands. If your application is experiencing slow response times or if you're seeing increased costs for database operations, it might be time for optimization.",
                  },
                  {
                    question: "How can database optimization improve my business operations?",
                    answer:
                      "Database optimization can significantly enhance your business operations by improving application performance, reducing response times, lowering infrastructure costs, and enabling your systems to handle larger data volumes and user loads. This leads to better user experience, increased productivity, and the ability to scale your business more effectively.",
                  },
                  {
                    question: "Do you work with both SQL and NoSQL databases?",
                    answer:
                      "Yes. I work with MySQL, PostgreSQL, and SQL Server, and with MongoDB and Redis when those are what you already run. The fix depends on which one is slow.",
                  },
                  {
                    question: "How do you ensure data integrity during the optimization process?",
                    answer:
                      "Data integrity is my top priority during any optimization process. I use a combination of techniques including thorough testing in staging environments, implementing transactional processes where possible, and creating backups before making any significant changes. I also use monitoring tools to ensure that data remains consistent throughout the optimization process.",
                  },
                  {
                    question: "Can you help with database optimization in cloud environments?",
                    answer:
                      "Absolutely. I have extensive experience optimizing databases in various cloud environments, including AWS, Google Cloud, and Azure. I can help you leverage cloud-specific features and services to enhance your database performance, implement effective scaling strategies, and optimize costs in cloud settings.",
                  },
                  {
                    question: "How long does the database optimization process typically take?",
                    answer:
                      "The duration of the optimization process can vary depending on the size and complexity of your database, as well as the specific issues being addressed. A basic optimization might take a few days, while more complex projects could span several weeks. I always provide a detailed timeline and keep you updated throughout the process.",
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