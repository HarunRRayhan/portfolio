'use client'

import { ServiceHero } from "@/Components/ServiceHero"
import { Button } from "@/Components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card"
import { Gauge, Zap, Database, Activity, ArrowRight, CheckCircle, Search, ClipboardList, Wrench, LineChart } from 'lucide-react'
import { Link, Head } from '@inertiajs/react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/Components/ui/accordion"
import { motion } from "framer-motion"
import { InfiniteScrollTech } from "@/Components/InfiniteScrollTech"
import { getImageUrl } from "@/lib/imageUtils"

const technologies = [
  {
    name: "PostgreSQL",
    logo: getImageUrl("/images/logos/db/postgresql-logo.png"),
  },
  {
    name: "MySQL",
    logo: getImageUrl("/images/logos/db/mysql-logo.svg"),
  },
  {
    name: "Redis",
    logo: getImageUrl("/images/logos/performance/redis-logo.svg"),
  },
  {
    name: "Docker",
    logo: getImageUrl("/images/logos/tech/docker-logo.svg"),
  },
  {
    name: "Kubernetes",
    logo: getImageUrl("/images/logos/tech/Kubernetes_logo_without_workmark.svg"),
  },
  {
    name: "AWS",
    logo: getImageUrl("/images/logos/tech/Amazon_Web_Services_Logo.svg"),
  },
  {
    name: "Terraform",
    logo: getImageUrl("/images/logos/tech/terraformio-icon.svg"),
  },
  {
    name: "Prometheus",
    logo: getImageUrl("/images/logos/tech/Prometheus_software_logo.svg"),
  },
  {
    name: "Grafana",
    logo: getImageUrl("/images/logos/tech/Grafana_icon.svg"),
  },
  {
    name: "Datadog",
    logo: getImageUrl("/images/logos/performance/datadog-logo.png"),
  },
  {
    name: "New Relic",
    logo: getImageUrl("/images/logos/performance/new-relic-logo.svg"),
  },
  {
    name: "Elasticsearch",
    logo: getImageUrl("/images/logos/logo-elastic-outlined-black.svg"),
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

export default function VibeScaling() {
  return (
    <>
      <Head>
        <title>Vibe Scaler: Scale Your AI-Built App | Harun R. Rayhan</title>
        <meta name="description" content="You built your app fast with AI coding tools and it found real users. We scale it in place: performance under load, database fixes, monitoring, and reliability, no rewrite required." />
        <meta name="keywords" content="scale vibe coded app, AI built app scaling, Cursor app scaling, Lovable app performance, Replit app production, database bottleneck fix, app performance consulting, scale in place" />

        {/* OpenGraph Tags */}
        <meta property="og:title" content="Vibe Scaler: Scale Your AI-Built App | Harun R. Rayhan" />
        <meta property="og:description" content="You built your app fast with AI coding tools and it found real users. We scale it in place: performance under load, database fixes, monitoring, and reliability, no rewrite required." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={window.location.href} />
        <meta property="og:image" content={getImageUrl("/service-assets/vibe-scaling/cover.jpg")} />

        {/* Twitter Card Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Vibe Scaler: Scale Your AI-Built App | Harun R. Rayhan" />
        <meta name="twitter:description" content="You built your app fast with AI coding tools and it found real users. We scale it in place: performance under load, database fixes, monitoring, and reliability, no rewrite required." />
        <meta name="twitter:image" content={getImageUrl("/service-assets/vibe-scaling/cover.jpg")} />

        {/* Canonical URL */}
        <link rel="canonical" href={window.location.href} />

        {/* JSON-LD Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Service",
            "name": "Vibe Scaler",
            "provider": {
              "@type": "Person",
              "name": "Harun R. Rayhan",
              "description": "Software Scaling and Performance Expert"
            },
            "serviceType": "Application Scaling Services",
            "description": "Scaling and hardening services for apps first built with AI coding tools, done in place without a rewrite",
            "offers": {
              "@type": "Offer",
              "description": "Performance Under Load, Database Hardening, Reliability and Monitoring"
            },
            "hasOfferCatalog": {
              "@type": "OfferCatalog",
              "name": "Vibe Scaler Services",
              "itemListElement": [
                {
                  "@type": "Offer",
                  "itemOffered": {
                    "@type": "Service",
                    "name": "Performance Under Load",
                    "description": "Profiling under real traffic and fixing the slow paths with caching, background workers, and query fixes"
                  }
                },
                {
                  "@type": "Offer",
                  "itemOffered": {
                    "@type": "Service",
                    "name": "Database Hardening",
                    "description": "Adding missing indexes, fixing N+1 queries, and setting up connection pooling so the database keeps up as data grows"
                  }
                },
                {
                  "@type": "Offer",
                  "itemOffered": {
                    "@type": "Service",
                    "name": "Reliability and Monitoring",
                    "description": "Error tracking, uptime checks, dashboards, backups, and a way to roll back a bad deploy"
                  }
                }
              ]
            }
          })}
        </script>
      </Head>
      <main className="flex flex-col min-h-screen">
        <ServiceHero
          icon={Gauge}
          title="Vibe Scaler"
          description="You built it fast with AI coding tools and it found real users. We take that app and make it hold up under the traffic and payments now coming through it."
          backgroundImage="/service-assets/vibe-scaling/hero.jpg"
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
              What We Do
            </motion.h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: Zap,
                  title: "Performance Under Load",
                  content:
                    "We profile the app under real traffic and fix the slow paths. That usually means adding caching, moving heavy work into background jobs, and rewriting the queries that drag pages down, so response times stay flat as usage climbs.",
                },
                {
                  icon: Database,
                  title: "A Database That Holds Up",
                  content:
                    "The database is where most vibe-coded apps break first. We add the indexes that are missing, fix the N+1 queries an AI tool tends to leave behind, and set up connection pooling so it keeps up as your data grows.",
                },
                {
                  icon: Activity,
                  title: "Reliability and Monitoring",
                  content:
                    "We add error tracking, uptime checks, and dashboards so you find out something broke before your users do. We also set up backups and a fast way to roll back a bad deploy.",
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
              Why Work With Us
            </motion.h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[
                {
                  title: "We respect what you built",
                  content:
                    "Vibe coding got you a working product and paying users. Most ideas never get that far. We treat that as the hard part being done, and our job is the next part, not second-guessing the first.",
                },
                {
                  title: "We fix the stack you already have",
                  content:
                    "This is scaling in place. We work with the code, framework, and hosting you already run instead of starting over, so you keep shipping to customers while we harden it underneath you.",
                },
                {
                  title: "We measure before we change anything",
                  content:
                    "We do not guess at what is slow. We run the app under load that matches your real traffic, find the actual bottlenecks, and fix those first so the work buys you the most headroom.",
                },
                {
                  title: "We hand it back to you",
                  content:
                    "When we are done we walk your team through what changed and how to keep it running. You are left with an app you can operate, not a dependency on us.",
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
              How It Works
            </motion.h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {[
                {
                  icon: Search,
                  title: "1. Audit",
                  content:
                    "We go through your code, database, and hosting, then run the app under realistic load to see where it strains.",
                },
                {
                  icon: ClipboardList,
                  title: "2. Plan",
                  content:
                    "You get a short list of what is slowing the app down and what each fix takes, ordered by how much it helps.",
                },
                {
                  icon: Wrench,
                  title: "3. Harden",
                  content:
                    "We do the work: caching, indexes, background jobs, connection limits, and whatever else the audit turned up. It ships in small changes so nothing breaks at once.",
                },
                {
                  icon: LineChart,
                  title: "4. Monitor",
                  content:
                    "We set up dashboards and alerts so problems surface early, and show your team how to read them.",
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
              Outgrowing the app that got you here?
            </motion.h2>
            <motion.div variants={fadeInUp}>
              <Link href="/contact">
                <Button size="lg" className="bg-slate-900 hover:bg-slate-800 text-white">
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
                    question: "Is there something wrong with vibe coding my app?",
                    answer:
                      "No. Building with AI coding tools to get a real product in front of people is a smart way to start, and it worked. You have users, and payments are coming in. That is the hard part, and most ideas never reach it. Scaling what you built is a different kind of work, and that is the part we do.",
                  },
                  {
                    question: "What does scaling in place mean?",
                    answer:
                      "It means we improve the app you already have instead of rewriting it. We keep your language, framework, and hosting, and fix the parts that cannot keep up with your traffic. You keep running your business while we do it.",
                  },
                  {
                    question: "What if my app actually needs a full rewrite?",
                    answer:
                      "Sometimes it does. If your stack has hit a real ceiling and no amount of tuning will get it where you need to go, we will tell you that plainly. Moving an app to a different language or framework is a separate service we offer, so you get an honest answer instead of patches that will not hold.",
                  },
                  {
                    question: "How do you decide what to fix first?",
                    answer:
                      "We measure before we touch anything. We run your app under load that matches your real traffic, watch where it slows down or falls over, and start with the changes that buy you the most headroom for the least risk.",
                  },
                  {
                    question: "Will my app go down while you work on it?",
                    answer:
                      "No. We ship changes in small pieces and test each one before it goes live. We also set up a fast way to roll back a deploy, so if something looks wrong after a release we can undo it in seconds.",
                  },
                  {
                    question: "Which stacks do you work with?",
                    answer:
                      "Most apps that come out of tools like Cursor, Bolt, Lovable, Replit, and v0. In practice that means React or Next.js on the front end, a Node, Python, or PHP backend, and PostgreSQL or MySQL behind it. If you are on something else, ask us and we will tell you honestly whether we can help.",
                  },
                ].map((faq, index) => (
                  <AccordionItem key={index} value={`item-${index + 1}`}>
                    <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
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
