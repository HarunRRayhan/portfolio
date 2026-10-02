'use client'

import { ServiceHero } from "@/Components/ServiceHero"
import { Button } from "@/Components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card"
import { Zap, GitBranch, Repeat, ArrowRight, CheckCircle, BarChart, Users, Code, Cloud } from 'lucide-react'
import { Link } from '@inertiajs/react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/Components/ui/accordion"
import { motion } from "framer-motion"
import { useEffect, useRef, useState } from "react"
import { InfiniteScrollTech } from "@/Components/InfiniteScrollTech"
import { getImageUrl } from "@/lib/imageUtils"

const technologies = [
  {
    name: "Jenkins",
    logo: getImageUrl("/images/logos/tech/jenkins.png"),
  },
  {
    name: "GitLab CI",
    logo: getImageUrl("/images/logos/tech/gitlab-icon-rgb.svg"),
  },
  {
    name: "GitHub Actions",
    logo: getImageUrl("/images/logos/tech/actions-icon-actions.svg"),
  },
  {
    name: "CircleCI",
    logo: getImageUrl("/images/logos/circleci-logo.svg"),
  },
  {
    name: "Travis CI",
    logo: getImageUrl("/images/logos/tech/TravisCI-Full-Color.png"),
  },
  {
    name: "AWS CodePipeline",
    logo: getImageUrl("/images/logos/aws-codepipeline-logo.svg"),
  },
  {
    name: "Azure DevOps",
    logo: getImageUrl("/images/logos/cloud/devops.png"),
  },
  {
    name: "Docker",
    logo: getImageUrl("/images/logos/tech/docker-logo.svg"),
  },
  {
    name: "Kubernetes",
    logo: getImageUrl("/images/logos/tech/favicon.png"),
  },
  {
    name: "Ansible",
    logo: getImageUrl("/images/logos/tech/Ansible-Mark-Large-RGB-Mango.png"),
  },
  {
    name: "Terraform",
    logo: getImageUrl("/images/logos/tech/logo-hashicorp.svg"),
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

export default function AutomatedDeployment({ canonicalUrl }: { canonicalUrl?: string }) {
  return (
    <>
      <main className="flex flex-col min-h-screen">
        <ServiceHero
          icon={GitBranch}
          title="Automated Deployment"
          description="Pipelines that build, test, and ship, without a checklist in someone's head."
          backgroundImage="/service-assets/automated-deployment/hero.jpg"
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
                  icon: GitBranch,
                  title: "Build and test on the pull request",
                  content: "A pull request builds and tests before anyone merges it.",
                },
                {
                  icon: Zap,
                  title: "Staging and production, same pipeline",
                  content:
                    "The same pipeline ships to staging and production. No one retypes the steps.",
                },
                {
                  icon: Repeat,
                  title: "Fix the slow pipeline first",
                  content:
                    "If the pipeline is slow or flaky, I fix that before I add more stages.",
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
                  title: "The tools you already run",
                  content:
                    "I use the CI you already have when it can do the job.",
                },
                {
                  title: "A pipeline for this repo",
                  content:
                    "The stages match how this app is built, tested, and shipped.",
                },
                {
                  title: "Checks before production",
                  content:
                    "Secrets stay out of the log, and a known-bad dependency fails the build.",
                },
                {
                  title: "From the notebook to production",
                  content:
                    "The pipeline should still be obvious when a second service shows up.",
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
                  title: "Watch one release",
                  content:
                    "I watch one release from commit to production and write down the manual steps.",
                },
                {
                  icon: Code,
                  title: "Stages and a rollback",
                  content: "You get the stages, the checks, and where a rollback happens.",
                },
                {
                  icon: Cloud,
                  title: "A real deploy",
                  content:
                    "I wire it into the repo and run a real deploy, not a demo.",
                },
                {
                  icon: Users,
                  title: "Notes next to the pipeline",
                  content:
                    "I walk the team through a release and leave the notes next to the pipeline.",
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
              If the release still lives in someone's head, start there.
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
                    question: "What is a pipeline, in practice?",
                    answer:
                      "A pull request builds and tests before it merges, and the same pipeline ships it. A release stops being a checklist in someone's head.",
                  },
                  {
                    question: "How long does a pipeline take?",
                    answer:
                      "A small pipeline is a few days. One with several services and a database is a few weeks.",
                  },
                  {
                    question: "Can you integrate CI/CD with our existing tools and workflows?",
                    answer:
                      "Yes. I use the git host and the deploy target you already have.",
                  },
                  {
                    question: "How do you keep a pipeline from leaking secrets?",
                    answer:
                      "Secrets stay out of the log, and a known-bad dependency fails the build.",
                  },
                  {
                    question: "What changes once deploys are automated?",
                    answer:
                      "You can ship more often, roll back, and stop retyping the same steps.",
                  },
                  {
                    question: "Where do database changes go?",
                    answer:
                      "Schema changes go through versioned migrations in the same pipeline, with a rollback. I don't hand-edit production.",
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