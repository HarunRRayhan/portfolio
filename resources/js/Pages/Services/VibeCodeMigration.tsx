'use client'

import { ServiceHero } from "@/Components/ServiceHero"
import { Button } from "@/Components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card"
import { Replace, Layers, Database, ArrowRight, CheckCircle, Search, ClipboardList, Code, Rocket } from 'lucide-react'
import { Link, Head } from '@inertiajs/react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/Components/ui/accordion"
import { motion } from "framer-motion"
import { InfiniteScrollTech } from "@/Components/InfiniteScrollTech"
import { getImageUrl } from "@/lib/imageUtils"

const technologies = [
  {
    name: "Node.js",
    logo: getImageUrl("/images/tech/nodejs.svg"),
  },
  {
    name: "Python",
    logo: getImageUrl("/images/tech/python.svg"),
  },
  {
    name: "Laravel",
    logo: getImageUrl("/images/tech/laravel.svg"),
  },
  {
    name: "Go",
    logo: getImageUrl("/images/tech/go.svg"),
  },
  {
    name: "React",
    logo: getImageUrl("/images/tech/react.svg"),
  },
  {
    name: "PostgreSQL",
    logo: getImageUrl("/images/logos/db/postgresql-logo.png"),
  },
  {
    name: "Redis",
    logo: getImageUrl("/images/logos/performance/redis-logo.svg"),
  },
  {
    name: "Docker",
    logo: getImageUrl("/images/tech/docker.svg"),
  },
  {
    name: "Kubernetes",
    logo: getImageUrl("/images/tech/kubernetes.svg"),
  },
  {
    name: "AWS",
    logo: getImageUrl("/images/tech/aws.svg"),
  },
  {
    name: "GitHub Actions",
    logo: getImageUrl("/images/tech/github-actions.svg"),
  },
  {
    name: "Terraform",
    logo: getImageUrl("/images/tech/terraform.svg"),
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

export default function VibeCodeMigration() {
  return (
    <>
      <Head>
        <title>Vibe Code Migration: Port Your AI-Built App to a Production Stack | Harun R. Rayhan</title>
        <meta name="description" content="Your prototype found real users, but the stack it started on cannot be its permanent home. We port it to a production language and framework, feature for feature, without losing data or the users you already have." />
        <meta name="keywords" content="migrate vibe coded app, port prototype to production, Cursor app migration, Lovable app port, no-code to production code, framework migration, feature parity testing, gradual cutover" />

        {/* OpenGraph Tags */}
        <meta property="og:title" content="Vibe Code Migration: Port Your AI-Built App to a Production Stack | Harun R. Rayhan" />
        <meta property="og:description" content="Your prototype found real users, but the stack it started on cannot be its permanent home. We port it to a production language and framework, feature for feature, without losing data or the users you already have." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={window.location.href} />
        <meta property="og:image" content={getImageUrl("/service-assets/vibe-code-migration/cover.jpg")} />

        {/* Twitter Card Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Vibe Code Migration: Port Your AI-Built App to a Production Stack | Harun R. Rayhan" />
        <meta name="twitter:description" content="Your prototype found real users, but the stack it started on cannot be its permanent home. We port it to a production language and framework, feature for feature, without losing data or the users you already have." />
        <meta name="twitter:image" content={getImageUrl("/service-assets/vibe-code-migration/cover.jpg")} />

        {/* Canonical URL */}
        <link rel="canonical" href={window.location.href} />

        {/* JSON-LD Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Service",
            "name": "Vibe Code Migration",
            "provider": {
              "@type": "Person",
              "name": "Harun R. Rayhan",
              "description": "Software Scaling and Performance Expert"
            },
            "serviceType": "Application Migration Services",
            "description": "Porting apps first built with AI coding tools to a production language and framework, with feature parity and no data loss",
            "offers": {
              "@type": "Offer",
              "description": "Production Rebuild With Parity, A Production Foundation, Data Migration"
            },
            "hasOfferCatalog": {
              "@type": "OfferCatalog",
              "name": "Vibe Code Migration Services",
              "itemListElement": [
                {
                  "@type": "Offer",
                  "itemOffered": {
                    "@type": "Service",
                    "name": "Production Rebuild With Parity",
                    "description": "Rebuilding the app on a new language and framework with identical behavior, verified against the original with parity tests"
                  }
                },
                {
                  "@type": "Offer",
                  "itemOffered": {
                    "@type": "Service",
                    "name": "A Production Foundation",
                    "description": "A typed codebase, real migrations, a test suite, and a deploy pipeline the team can keep extending"
                  }
                },
                {
                  "@type": "Offer",
                  "itemOffered": {
                    "@type": "Service",
                    "name": "Data Migration",
                    "description": "Moving users, records, and history to the new schema in stages, with row counts and key records verified on both sides"
                  }
                }
              ]
            }
          })}
        </script>
      </Head>
      <main className="flex flex-col min-h-screen">
        <ServiceHero
          icon={Replace}
          title="Vibe Code Migration"
          description="Your prototype did its job and found real users. When the stack it started on cannot carry it any further, we move it to a production language and framework and keep every feature working."
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
                  icon: Replace,
                  title: "A Rebuild That Matches",
                  content:
                    "We port your app to a new language and framework and keep the behavior identical. Every screen, rule, and edge case comes across the same way, checked against the original with parity tests so nothing quietly changes.",
                },
                {
                  icon: Layers,
                  title: "A Production Foundation",
                  content:
                    "The new build sits on a language and framework meant to run for years, with typed code, real migrations, a test suite, and a deploy pipeline. It is a base your team can keep extending long after the move is done.",
                },
                {
                  icon: Database,
                  title: "Your Data Comes With It",
                  content:
                    "Users, records, and history move over intact. We map the old schema to the new one, migrate the data in stages, and verify row counts and key records on both sides before anything goes live.",
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
                    "The prototype found users and proved the idea. That is the hard part, and vibe coding is a smart way to get there. Our job is the move to a stack that lasts, not second-guessing how you started.",
                },
                {
                  title: "We keep parity front and center",
                  content:
                    "A migration is only done when the new app does everything the old one did. We write tests against the current behavior first, then port until every one of them passes, so features do not go missing in the move.",
                },
                {
                  title: "We have done this on harder systems",
                  content:
                    "We have ported production systems a lot more involved than a weekend project, including business software running on older frameworks. The care that protects a system that size protects yours.",
                },
                {
                  title: "We hand it back to you",
                  content:
                    "When the move is done we walk your team through the new stack and how it is put together. You are left with an app you can run and extend, not a dependency on us.",
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
                  title: "1. Map",
                  content:
                    "We go through the current app and write down what it does: every feature, rule, and integration. That map becomes the checklist the new build has to satisfy.",
                },
                {
                  icon: ClipboardList,
                  title: "2. Plan",
                  content:
                    "We pick the target language and framework that fit where the product is going, then lay out the order of work and how the data will move, before writing new code.",
                },
                {
                  icon: Code,
                  title: "3. Port",
                  content:
                    "We rebuild the app on the new stack feature by feature, checking each one against the original with parity tests. Work ships in pieces so progress stays visible.",
                },
                {
                  icon: Rocket,
                  title: "4. Cut Over",
                  content:
                    "We run the new app alongside the old one, move traffic across gradually, and keep the old version ready as a fallback until the new one has proven itself in production.",
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
              Ready to move to a stack that lasts?
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
                    question: "Does migrating mean my prototype was a mistake?",
                    answer:
                      "No. Building fast with AI coding tools is a smart way to get a real product in front of people, and it worked. A prototype stack is meant to prove an idea, not run forever. Moving to a production language and framework is the next step after that, not a fix for a wrong first one.",
                  },
                  {
                    question: "Will we lose any data or features in the migration?",
                    answer:
                      "No. Keeping everything is the whole reason to do it carefully. We write down every feature in the current app and turn it into a checklist the new build has to pass. Data moves over in stages with row counts and key records verified on both sides. If something does not match, it does not ship.",
                  },
                  {
                    question: "Why not just keep scaling the current stack instead of moving?",
                    answer:
                      "Often that is the right call, and it is a separate service we offer called Vibe Scaler. Scaling in place works when the stack is sound and only its config and slow paths need attention. Migration is for when the stack itself is the ceiling, where the language or framework cannot get you where the product is going no matter how much you tune it. We will tell you honestly which case you are in before you spend anything.",
                  },
                  {
                    question: "How do you handle cutover and downtime?",
                    answer:
                      "We run the new app next to the old one rather than flipping a switch. Traffic moves across in stages, starting small, and we watch each step. The old version stays ready the whole time, so if anything looks wrong we route back to it in seconds while we sort it out.",
                  },
                  {
                    question: "What languages and frameworks do you migrate to?",
                    answer:
                      "Whatever fits where your product is heading. In practice that is often a typed backend on Node, Python, Go, or PHP with a framework like Laravel, a React front end, and PostgreSQL behind it. We pick the target for the next few years of the product, not just the next release.",
                  },
                  {
                    question: "How long does a migration take?",
                    answer:
                      "It depends on how much the app does, which is why the first step is mapping every feature. A small app can move in a few weeks. A larger one ships in stages, with parts running on the new stack while the rest still runs on the old one, so you are never waiting on one big release.",
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
