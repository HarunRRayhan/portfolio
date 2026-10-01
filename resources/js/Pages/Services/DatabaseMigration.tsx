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
                  title: "Database Assessment",
                  content:
                    "Thoroughly assess your current database architecture and develop a tailored migration strategy.",
                },
                {
                  icon: ArrowRightLeft,
                  title: "Data Migration",
                  content:
                    "Securely migrate your data to the new database platform with minimal downtime and data loss risk.",
                },
                {
                  icon: Shield,
                  title: "Post-Migration Support",
                  content:
                    "Provide ongoing support and optimization to ensure smooth operation of your new database environment.",
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
              How I handle Database Migration
            </motion.h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[
                {
                  title: "Expertise Across Database Platforms",
                  content:
                    "I move MySQL, PostgreSQL, and the managed databases people usually mean, and I check the rows on both sides before cutover.",
                },
                {
                  title: "Minimal Downtime",
                  content: "I use advanced migration techniques to minimize disruption to your business operations.",
                },
                {
                  title: "Data Integrity Assurance",
                  content:
                    "I implement rigorous validation processes to ensure data accuracy and completeness during migration.",
                },
                {
                  title: "Performance Optimization",
                  content:
                    "I optimize your database structure and queries for improved performance in the new environment.",
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
                  title: "1. Assessment",
                  content: "I assess your current database architecture and develop a comprehensive migration plan.",
                },
                {
                  icon: Cloud,
                  title: "2. Preparation",
                  content: "I prepare the target environment and set up necessary tools for the migration process.",
                },
                {
                  icon: ArrowRightLeft,
                  title: "3. Migration",
                  content: "I execute the migration, ensuring data integrity and minimal disruption to your operations.",
                },
                {
                  icon: BarChart,
                  title: "4. Validation & Optimization",
                  content:
                    "I validate the migrated data and optimize the new database environment for peak performance.",
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
              Ready to migrate your database?
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
                    question: "Why should I consider database migration?",
                    answer:
                      "Database migration can offer numerous benefits, including improved performance, scalability, and cost-efficiency. It can also provide access to new features and capabilities, better security, and easier maintenance. If your current database is struggling to meet your needs or if you're looking to modernize your infrastructure, database migration might be the right choice.",
                  },
                  {
                    question: "How do you ensure data integrity during migration?",
                    answer:
                      "Ensuring data integrity is my top priority during migration. I use a combination of techniques, including thorough pre-migration testing, data validation checks, and post-migration reconciliation. I also implement robust error handling and rollback procedures. Where possible, I use tools that provide checksums or other integrity verification methods to ensure that every piece of data is accurately transferred.",
                  },
                  {
                    question: "How do you minimize downtime during database migration?",
                    answer:
                      "I employ several strategies to minimize downtime, depending on your specific needs and constraints. These may include using replication to keep the old and new databases in sync during migration, performing the migration in phases, or using 'zero-downtime' migration techniques where possible. In cases where some downtime is unavoidable, I carefully plan the migration to occur during off-peak hours to minimize disruption.",
                  },
                  {
                    question: "Can you migrate between different types of databases?",
                    answer:
                      "Yes, I can handle migrations between different types of databases, often referred to as heterogeneous migrations. This could involve moving from a relational database to a NoSQL database, or between different relational database management systems (e.g., from Oracle to PostgreSQL). These migrations often involve schema conversion and data transformation, which I carefully plan and execute to ensure compatibility and optimal performance in the new environment.",
                  },
                  {
                    question: "How do you handle large-scale database migrations?",
                    answer:
                      "For large-scale migrations, I employ a variety of techniques to ensure efficiency and reliability. This may include parallel processing to speed up data transfer, incremental migration approaches to reduce risk, and specialized tools designed for handling large volumes of data. I also pay special attention to performance optimization both during and after the migration to ensure that the new database can handle the large-scale data effectively.",
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