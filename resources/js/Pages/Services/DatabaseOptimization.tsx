'use client'

import { Menubar } from "@/Components/Menubar"
import { Footer } from "@/Components/Footer"
import { ServiceHero } from "@/Components/ServiceHero"
import { Button } from "@/Components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card"
import { Database, Zap, Lock, ArrowRight, CheckCircle, BarChart, Users, GitBranch, Cloud } from 'lucide-react'
import { Link, Head } from '@inertiajs/react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/Components/ui/accordion"
import { motion } from "framer-motion"
import { useEffect, useRef, useState } from "react"
import { InfiniteScrollTech } from "@/Components/InfiniteScrollTech"
import { getImageUrl } from "@/lib/imageUtils"

const technologies = [
  {
    name: "MySQL",
    logo: getImageUrl("/images/logos/tech/logo-mysql-170x115.png"),
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
    logo: getImageUrl("/images/logos/tech/rh03-oracle-logo.png"),
  },
  {
    name: "Microsoft SQL Server",
    logo: getImageUrl("/images/logos/db/sql-server-logo.png"),
  },
  {
    name: "Redis",
    logo: getImageUrl("/images/logos/tech/redis-white.png"),
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
    logo: getImageUrl("/images/logos/tech/hp_schema%402x.b509be7f0e26575880dbd3f100d2d9fc3585ef14.png"),
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

export default function DatabaseOptimization() {
  return (
    <>
      <Head>
        <title>Database Performance Optimization Services | Harun R. Rayhan</title>
        <meta name="description" content="Expert database optimization services. Enhance your database performance, improve query efficiency, and optimize resource utilization for better scalability." />
        <meta name="keywords" content="database optimization, performance tuning, query optimization, database efficiency, index optimization, database consulting, MySQL optimization, PostgreSQL optimization" />
        
        {/* OpenGraph Tags */}
        <meta property="og:title" content="Database Performance Optimization Services | Harun R. Rayhan" />
        <meta property="og:description" content="Expert database optimization services. Enhance your database performance, improve query efficiency, and optimize resource utilization for better scalability." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={window.location.href} />
        
        {/* Twitter Card Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Database Performance Optimization Services | Harun R. Rayhan" />
        <meta name="twitter:description" content="Expert database optimization services. Enhance your database performance, improve query efficiency, and optimize resource utilization for better scalability." />
        
        {/* Canonical URL */}
        <link rel="canonical" href={window.location.href} />

        {/* JSON-LD Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Service",
            "name": "Database Optimization Services",
            "provider": {
              "@type": "Person",
              "name": "Harun R. Rayhan",
              "description": "Database Performance Expert"
            },
            "serviceType": "Database Services",
            "description": "Expert database performance optimization and tuning services",
            "offers": {
              "@type": "Offer",
              "description": "Performance Analysis, Query Optimization, Resource Optimization"
            },
            "hasOfferCatalog": {
              "@type": "OfferCatalog",
              "name": "Database Optimization Services",
              "itemListElement": [
                {
                  "@type": "Offer",
                  "itemOffered": {
                    "@type": "Service",
                    "name": "Performance Analysis",
                    "description": "Comprehensive analysis of database performance and bottlenecks"
                  }
                },
                {
                  "@type": "Offer",
                  "itemOffered": {
                    "@type": "Service",
                    "name": "Query Optimization",
                    "description": "SQL query optimization and index tuning for better performance"
                  }
                },
                {
                  "@type": "Offer",
                  "itemOffered": {
                    "@type": "Service",
                    "name": "Resource Optimization",
                    "description": "Database resource utilization and configuration optimization"
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
          icon={Database}
          title="Database Optimization"
          description="Optimize your database performance, scalability, and reliability for maximum efficiency."
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
              Our Database Optimization Services
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
              Why Choose Us for Database Optimization
            </motion.h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[
                {
                  title: "Expertise Across Database Systems",
                  content:
                    "Our team has deep knowledge of various database systems, ensuring optimal solutions for your specific setup.",
                },
                {
                  title: "Data-Driven Approach",
                  content:
                    "We use advanced analytics and monitoring tools to identify bottlenecks and optimize based on real usage patterns.",
                },
                {
                  title: "Holistic Optimization",
                  content:
                    "We consider all aspects of your database ecosystem, including hardware, software, and application layers.",
                },
                {
                  title: "Continuous Improvement",
                  content:
                    "We implement ongoing monitoring and optimization processes to ensure sustained performance over time.",
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
              Our Database Optimization Process
            </motion.h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {[
                {
                  icon: BarChart,
                  title: "1. Assessment",
                  content:
                    "We thoroughly analyze your current database performance, identifying bottlenecks and areas for improvement.",
                },
                {
                  icon: GitBranch,
                  title: "2. Strategy Development",
                  content:
                    "We create a tailored optimization plan based on our assessment and your specific business needs.",
                },
                {
                  icon: Database,
                  title: "3. Implementation",
                  content: "We execute the optimization strategies, carefully monitoring the impact on your system.",
                },
                {
                  icon: Cloud,
                  title: "4. Monitoring & Refinement",
                  content:
                    "We set up ongoing monitoring and continuously refine our optimizations to ensure sustained performance.",
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
              Ready to optimize your database performance?
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
                      "Yes, we have expertise in optimizing both SQL databases (like MySQL, PostgreSQL, and SQL Server) and NoSQL databases (such as MongoDB, Cassandra, and Redis). Our team is well-versed in the unique characteristics and optimization strategies for various database systems.",
                  },
                  {
                    question: "How do you ensure data integrity during the optimization process?",
                    answer:
                      "Data integrity is our top priority during any optimization process. We use a combination of techniques including thorough testing in staging environments, implementing transactional processes where possible, and creating backups before making any significant changes. We also use monitoring tools to ensure that data remains consistent throughout the optimization process.",
                  },
                  {
                    question: "Can you help with database optimization in cloud environments?",
                    answer:
                      "Absolutely. We have extensive experience optimizing databases in various cloud environments, including AWS, Google Cloud, and Azure. We can help you leverage cloud-specific features and services to enhance your database performance, implement effective scaling strategies, and optimize costs in cloud settings.",
                  },
                  {
                    question: "How long does the database optimization process typically take?",
                    answer:
                      "The duration of the optimization process can vary depending on the size and complexity of your database, as well as the specific issues being addressed. A basic optimization might take a few days, while more complex projects could span several weeks. We always provide a detailed timeline and keep you updated throughout the process.",
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