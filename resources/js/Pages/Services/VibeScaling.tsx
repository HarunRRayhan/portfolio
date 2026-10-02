'use client'

import { ServiceHero } from "@/Components/ServiceHero"
import { Button } from "@/Components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card"
import { Gauge, Zap, Database, Activity, ArrowRight, CheckCircle, Search, ClipboardList, Wrench, LineChart } from 'lucide-react'
import { Link } from '@inertiajs/react'
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

export default function VibeScaling({ canonicalUrl }: { canonicalUrl?: string }) {
  return (
    <>
      <main className="flex flex-col min-h-screen">
        <ServiceHero
          icon={Gauge}
          title="Vibe Scaler"
          description="You built it fast with an AI coding tool and it found users. I scale that app in place so it can take the traffic and the payments."
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
              What I do
            </motion.h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: Zap,
                  title: "Performance Under Load",
                  content:
                    "I profile the app under real traffic and fix the slow paths. That usually means adding caching, moving heavy work into background jobs, and rewriting the queries that drag pages down, so response times stay flat as usage climbs.",
                },
                {
                  icon: Database,
                  title: "A Database That Holds Up",
                  content:
                    "The database is where most vibe-coded apps break first. I add the indexes that are missing, fix the N+1 queries an AI tool tends to leave behind, and set up connection pooling so it keeps up as your data grows.",
                },
                {
                  icon: Activity,
                  title: "Reliability and Monitoring",
                  content:
                    "I add error tracking, uptime checks, and dashboards so you find out something broke before your users do. I also set up backups and a fast way to roll back a bad deploy.",
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
                  title: "I respect what you built",
                  content:
                    "Vibe coding got you a working product and paying users. Most ideas never get that far. I treat that as the hard part being done, and my job is the next part, not second-guessing the first.",
                },
                {
                  title: "I fix the stack you already have",
                  content:
                    "This is scaling in place. I work with the code, framework, and hosting you already run instead of starting over, so you keep shipping to customers while I harden it underneath you.",
                },
                {
                  title: "I measure before I change anything",
                  content:
                    "I do not guess at what is slow. I run the app under load that matches your real traffic, find the actual bottlenecks, and fix those first so the work buys you the most headroom.",
                },
                {
                  title: "I hand it back to you",
                  content:
                    "When I am done I walk your team through what changed and how to keep it running. You are left with an app you can operate, not a dependency on me.",
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
                    "I go through your code, database, and hosting, then run the app under realistic load to see where it strains.",
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
                    "I do the work: caching, indexes, background jobs, connection limits, and whatever else the audit turned up. It ships in small changes so nothing breaks at once.",
                },
                {
                  icon: LineChart,
                  title: "4. Monitor",
                  content:
                    "I set up dashboards and alerts so problems surface early, and show your team how to read them.",
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
                    question: "Is there something wrong with vibe coding my app?",
                    answer:
                      "No. Building with AI coding tools to get a real product in front of people is a smart way to start, and it worked. You have users, and payments are coming in. That is the hard part, and most ideas never reach it. Scaling what you built is a different kind of work, and that is the part I do.",
                  },
                  {
                    question: "What does scaling in place mean?",
                    answer:
                      "It means I improve the app you already have instead of rewriting it. I keep your language, framework, and hosting, and fix the parts that cannot keep up with your traffic. You keep running your business while I do it.",
                  },
                  {
                    question: "What if my app actually needs a full rewrite?",
                    answer:
                      "Sometimes it does. If your stack has hit a real ceiling and no amount of tuning will get it where you need to go, I will tell you that plainly. Moving an app to a different language or framework is a separate service I offer, so you get an honest answer instead of patches that will not hold.",
                  },
                  {
                    question: "How do you decide what to fix first?",
                    answer:
                      "I measure before I touch anything. I run your app under load that matches your real traffic, watch where it slows down or falls over, and start with the changes that buy you the most headroom for the least risk.",
                  },
                  {
                    question: "Will my app go down while you work on it?",
                    answer:
                      "No. I ship changes in small pieces and test each one before it goes live. I also set up a fast way to roll back a deploy, so if something looks wrong after a release I can undo it in seconds.",
                  },
                  {
                    question: "Which stacks do you work with?",
                    answer:
                      "Most apps that come out of tools like Cursor, Bolt, Lovable, Replit, and v0. In practice that means React or Next.js on the front end, a Node, Python, or PHP backend, and PostgreSQL or MySQL behind it. If you are on something else, ask me and I will tell you honestly whether I can help.",
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
