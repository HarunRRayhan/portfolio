"use client"

import { Head, Link } from "@inertiajs/react"
import { motion } from "framer-motion"
import { ServiceHero } from "@/Components/ServiceHero"
import { Button } from "@/Components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card/index"
import { Server, GitBranch, ArrowRight, CheckCircle, BarChart, Users, Code, Cloud } from "lucide-react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/Components/ui/accordion"
import { getImageUrl } from "@/lib/imageUtils"

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 },
}

const staggerChildren = {
  animate: { transition: { staggerChildren: 0.1 } },
}

export default function InfrastructureAsCodePage({ canonicalUrl }: { canonicalUrl?: string }) {
  return (
    <>
      <Head>
        <title>Infrastructure as Code (IaC) Services | Harun R. Rayhan</title>
        <meta name="description" content="Get help with Terraform changes, plan reviews, state and IAM checks, and CI workflows for AWS infrastructure. See how Harun approaches the work." />
        
        {/* OpenGraph Tags */}
        <meta property="og:title" content="Infrastructure as Code (IaC) Services | Harun R. Rayhan" />
        <meta property="og:description" content="Get help with Terraform changes, plan reviews, state and IAM checks, and CI workflows for AWS infrastructure. See how Harun approaches the work." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:image" content={getImageUrl("/service-assets/infrastructure-as-code/hero.jpg")} />

        {/* Twitter Card Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Infrastructure as Code (IaC) Services | Harun R. Rayhan" />
        <meta name="twitter:description" content="Get help with Terraform changes, plan reviews, state and IAM checks, and CI workflows for AWS infrastructure. See how Harun approaches the work." />
        <meta name="twitter:image" content={getImageUrl("/service-assets/infrastructure-as-code/hero.jpg")} />

        {/* Canonical URL */}
        <link rel="canonical" href={canonicalUrl} />

        {/* JSON-LD Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Service",
            "name": "Infrastructure as Code Services",
            "provider": {
              "@type": "Person",
              "name": "Harun R. Rayhan"
            },
            "serviceType": "Infrastructure Automation",
            "description": "Terraform changes, plan reviews, state and IAM checks, and CI workflows for AWS infrastructure",
            "offers": {
              "@type": "Offer",
              "description": "Terraform implementation and plan review for AWS infrastructure"
            },
            "hasOfferCatalog": {
              "@type": "OfferCatalog",
              "name": "Infrastructure as Code Services",
              "itemListElement": [
                {
                  "@type": "Offer",
                  "itemOffered": {
                    "@type": "Service",
                    "name": "Terraform changes",
                    "description": "Change an existing AWS infrastructure stack using Terraform"
                  }
                },
                {
                  "@type": "Offer",
                  "itemOffered": {
                    "@type": "Service",
                    "name": "Terraform plan review",
                    "description": "Review planned resource changes, IAM permissions, and deployment risks"
                  }
                },
                {
                  "@type": "Offer",
                  "itemOffered": {
                    "@type": "Service",
                    "name": "Pull request checks",
                    "description": "Add Terraform validation and plan checks to a delivery workflow"
                  }
                }
              ]
            }
          })}
        </script>
      </Head>
      <main className="flex flex-col min-h-screen">
        <ServiceHero
          icon={Server}
          title="Infrastructure as Code"
          description="Need to change AWS infrastructure without guessing what Terraform will touch? I can help review the current stack, make the change, and check the plan before it is applied."
          backgroundImage="/service-assets/infrastructure-as-code/hero.jpg"
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
              Where I can help with Terraform
            </motion.h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: Code,
                  title: "Changes to an existing stack",
                  content:
                    "Add or change AWS resources in your Terraform code. Start with the modules, state, account, and region you already use.",
                },
                {
                  icon: GitBranch,
                  title: "Plan and IAM review",
                  content:
                    "Read the Terraform plan for replacements, downtime, and unexpected cost. Check generated IAM policies before a change reaches production.",
                },
                {
                  icon: Cloud,
                  title: "Checks in the delivery pipeline",
                  content:
                    "Add validation and plan checks to the pull request workflow so reviewers can see what will change before an apply.",
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
              What the work includes
            </motion.h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[
                {
                  title: "Your existing conventions",
                  content:
                    "I read the repository and its deployment rules before editing. Resource names, state location, account boundaries, and cost limits matter more than a generic template.",
                },
                {
                  title: "A reviewable plan",
                  content:
                    "The change comes with a Terraform plan and a short explanation of additions, replacements, and anything that needs a human decision.",
                },
                {
                  title: "Checks before apply",
                  content:
                    "Validation catches syntax and provider errors. The full plan catches changes validation cannot see, including resource replacement and drift.",
                },
                {
                  title: "A usable handoff",
                  content:
                    "I document the commands, state assumptions, and review steps so your team can make the next change without rediscovering them.",
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
              How an engagement starts
            </motion.h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {[
                {
                  icon: BarChart,
                  title: "1. Read the stack",
                  content:
                    "I look at the repository, state backend, AWS accounts, deployment path, and the change you need to make.",
                },
                {
                  icon: Code,
                  title: "2. Agree on the change",
                  content:
                    "You and I identify the affected resources and decide what needs review or should stay out of scope.",
                },
                {
                  icon: GitBranch,
                  title: "3. Code and plan",
                  content: "I make the change, run validation, and review the plan with you before anything is applied.",
                },
                {
                  icon: Users,
                  title: "4. Hand over",
                  content:
                    "You get the code, the plan review notes, and the steps needed to maintain the change.",
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

        <section className="py-20 bg-[#F8F9FA]">
          <div className="container mx-auto px-4 max-w-3xl">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">See the workflow before we talk</h2>
            <p className="text-lg text-gray-700 mb-6">
              I wrote up how I use Claude Code with Terraform on AWS, including the context file, validation hooks, plan review, and the places where I still check everything myself.
            </p>
            <Link href="/blog/claude-code-for-aws-infrastructure-agentic-devops-workflow-with-terraform" className="inline-flex items-center font-semibold text-amber-700 hover:text-amber-800">
              Read my AWS and Terraform workflow <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </div>
        </section>

        <motion.section className="py-24 bg-white" initial="initial" animate="animate" variants={staggerChildren}>
          <div className="container mx-auto px-4 text-center">
            <motion.h2 className="text-3xl font-bold mb-8" variants={fadeInUp}>
              Need a second set of eyes on a Terraform change?
            </motion.h2>
            <motion.div variants={fadeInUp}>
              <Link href="/contact">
                <Button size="lg" className="bg-slate-900 hover:bg-slate-800 text-white">
                  Discuss your infrastructure
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
                    question: "Can you work with the Terraform code we already have?",
                    answer:
                      "Yes. I start by reading your modules, state setup, account boundaries, and deployment rules. The aim is to make the requested change in your existing stack rather than replace it with a new template.",
                  },
                  {
                    question: "What do you check before applying a Terraform plan?",
                    answer:
                      "I run validation and review the plan for resource replacement, downtime, IAM permissions, and unexpected cost. A valid configuration can still produce a risky plan, so the plan needs a human review.",
                  },
                  {
                    question: "Can you add checks to our pull request workflow?",
                    answer:
                      "Yes. I can add validation and plan checks that fit your repository and approval process. Reviewers should be able to see the proposed infrastructure change before an apply.",
                  },
                  {
                    question: "What will we have when the work is done?",
                    answer:
                      "You will have the code change, the reviewed plan, and notes on the state assumptions and steps your team needs for the next change. The exact handoff depends on the scope we agree on first.",
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
