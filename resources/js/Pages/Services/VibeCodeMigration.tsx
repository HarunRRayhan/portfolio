'use client'

import { ServiceHero } from "@/Components/ServiceHero"
import { Button } from "@/Components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card"
import { Replace, Layers, Database, ArrowRight, CheckCircle, Search, ClipboardList, Code, Rocket } from 'lucide-react'
import { Link } from '@inertiajs/react'
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

export default function VibeCodeMigration({ canonicalUrl }: { canonicalUrl?: string }) {
  return (
    <>
      <main className="flex flex-col min-h-screen">
        <ServiceHero
          icon={Replace}
          title="Vibe Code Migration"
          description="The prototype found users. When that stack can't carry it, I port it to a production language and framework and keep the features working."
          backgroundImage="/service-assets/vibe-code-migration/hero.jpg"
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
                  icon: Replace,
                  title: "A Rebuild That Matches",
                  content:
                    "I port your app to a new language and framework and keep the behavior identical. Every screen, rule, and edge case comes across the same way, checked against the original with parity tests so nothing quietly changes.",
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
                    "Users, records, and history move over intact. I map the old schema to the new one, migrate the data in stages, and verify row counts and key records on both sides before anything goes live.",
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
                  title: "I respect what you built",
                  content:
                    "The prototype found users and proved the idea. That is the hard part, and vibe coding is a smart way to get there. My job is the move to a stack that lasts, not second-guessing how you started.",
                },
                {
                  title: "I keep parity front and center",
                  content:
                    "A migration is only done when the new app does everything the old one did. I write tests against the current behavior first, then port until every one of them passes, so features do not go missing in the move.",
                },
                {
                  title: "I have done this on harder systems",
                  content:
                    "I have ported production systems a lot more involved than a weekend project, including business software running on older frameworks. The care that protects a system that size protects yours.",
                },
                {
                  title: "I hand it back to you",
                  content:
                    "When the move is done I walk your team through the new stack and how it is put together. You are left with an app you can run and extend, not a dependency on me.",
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
                  icon: Search,
                  title: "Map the app",
                  content:
                    "I go through the current app and write down what it does: every feature, rule, and integration. That map becomes the checklist the new build has to satisfy.",
                },
                {
                  icon: ClipboardList,
                  title: "Pick the stack",
                  content:
                    "I pick the target language and framework that fit where the product is going, then lay out the order of work and how the data will move, before writing new code.",
                },
                {
                  icon: Code,
                  title: "Port it in pieces",
                  content:
                    "I rebuild the app on the new stack feature by feature, checking each one against the original with parity tests. Work ships in pieces so progress stays visible.",
                },
                {
                  icon: Rocket,
                  title: "Move traffic across",
                  content:
                    "I run the new app alongside the old one, move traffic across gradually, and keep the old version ready as a fallback until the new one has proven itself in production.",
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
                    question: "Does migrating mean my prototype was a mistake?",
                    answer:
                      "No. Building fast with AI coding tools is a smart way to get a real product in front of people, and it worked. A prototype stack is meant to prove an idea, not run forever. Moving to a production language and framework is the next step after that, not a fix for a wrong first one.",
                  },
                  {
                    question: "Will we lose any data or features in the migration?",
                    answer:
                      "No. Keeping everything is the whole reason to do it carefully. I write down every feature in the current app and turn it into a checklist the new build has to pass. Data moves over in stages with row counts and key records verified on both sides. If something does not match, it does not ship.",
                  },
                  {
                    question: "Why not just keep scaling the current stack instead of moving?",
                    answer:
                      "Often that is the right call, and it is a separate service I offer called Vibe Scaler. Scaling in place works when the stack is sound and only its config and slow paths need attention. Migration is for when the stack itself is the ceiling, where the language or framework cannot get you where the product is going no matter how much you tune it. I will tell you honestly which case you are in before you spend anything.",
                  },
                  {
                    question: "How do you handle cutover and downtime?",
                    answer:
                      "I run the new app next to the old one rather than flipping a switch. Traffic moves across in stages, starting small, and I watch each step. The old version stays ready the whole time, so if anything looks wrong I route back to it in seconds while I sort it out.",
                  },
                  {
                    question: "What languages and frameworks do you migrate to?",
                    answer:
                      "Whatever fits where your product is heading. In practice that is often a typed backend on Node, Python, Go, or PHP with a framework like Laravel, a React front end, and PostgreSQL behind it. I pick the target for the next few years of the product, not just the next release.",
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
