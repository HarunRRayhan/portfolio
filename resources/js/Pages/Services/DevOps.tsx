"use client"

import React, { useEffect, useRef, useState } from "react"
import { Link } from "@inertiajs/react"
import { motion } from "framer-motion"
import { ServiceHero } from "@/Components/ServiceHero"
import { Button } from "@/Components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card/index"
import { Code, GitBranch, Repeat, ArrowRight, CheckCircle, Users } from "lucide-react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/Components/ui/accordion"
import { getImageUrl } from "@/lib/imageUtils"

const technologies = [
  {
    name: "Jenkins",
    logo: getImageUrl("/images/logos/tech/Jenkins_logo.svg"),
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
    name: "Terraform",
    logo: getImageUrl("/images/logos/tech/terraformio-icon.svg"),
  },
  {
    name: "AWS",
    logo: getImageUrl("/images/logos/tech/Amazon_Web_Services_Logo.svg"),
  },
  {
    name: "GitHub Actions",
    logo: getImageUrl("/images/logos/tech/actions-icon-actions.svg"),
  },
  {
    name: "Ansible",
    logo: getImageUrl("/images/logos/tech/Ansible_logo.svg"),
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
    name: "GitLab",
    logo: getImageUrl("/images/logos/tech/gitlab-icon-rgb.svg"),
  },
  {
    name: "Puppet",
    logo: getImageUrl("/images/logos/tech/Puppet_transparent_logo.svg"),
  },
  {
    name: "Chef",
    logo: getImageUrl("/images/logos/tech/Chef_logo.svg"),
  },
  {
    name: "Nagios",
    logo: getImageUrl("/images/logos/Nagios-Logo.jpg"),
  },
  {
    name: "Splunk",
    logo: getImageUrl("/images/logos/tech/splunk-logo.png"),
  },
  {
    name: "ELK Stack",
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

export default function DevOpsPage({ canonicalUrl }: { canonicalUrl?: string }) {
  const [isVisible, setIsVisible] = useState(false)
  const sectionRef = useRef(null)

  // og:image/twitter:image need a fully-qualified URL. getImageUrl() already
  // returns an absolute CDN URL in production; fall back to the canonical
  // domain everywhere else so link previews still resolve.
  const devopsOgImagePath = getImageUrl('/service-assets/devops/hero.jpg')
  const ogImageUrl = devopsOgImagePath.startsWith('http') ? devopsOgImagePath : `https://harun.dev${devopsOgImagePath}`

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting)
      },
      { threshold: 0.1 },
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current)
      }
    }
  }, [])

  return (
    <>
      <main className="flex flex-col min-h-screen">
        <ServiceHero
          icon={GitBranch}
          title="DevOps"
          description="CI, infrastructure as code, and a release path the team can run without me in the room."
          backgroundImage="/service-assets/devops/hero.jpg"
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
                  title: "CI/CD Pipeline Setup",
                  content:
                    "I set up the pipeline that builds, tests, and ships, so a release is a button instead of a checklist.",
                },
                {
                  icon: Code,
                  title: "Infrastructure as Code",
                  content:
                    "I put the infrastructure in Terraform or Ansible, so the next change is a review instead of a console click.",
                },
                {
                  icon: Repeat,
                  title: "Continuous Monitoring",
                  content:
                    "I add the metrics and the alarms that page someone before users write in.",
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
                  title: "The stack you already have",
                  content:
                    "I use the tools that fit the stack you already have.",
                },
                {
                  title: "Fit to the repo",
                  content:
                    "I fit the pipeline to the repo and the deploy you already use.",
                },
                {
                  title: "Less manual release work",
                  content:
                    "The point is a release your team can run without me in the room.",
                },
                {
                  title: "A number you can watch",
                  content:
                    "I track how often you ship, how long a change takes, and how often it fails.",
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
                  icon: GitBranch,
                  title: "1. Assessment",
                  content: "I look at how a change gets from a pull request to production.",
                },
                {
                  icon: Code,
                  title: "2. Strategy",
                  content: "You get a short list: the pipeline, the infrastructure code, and what to measure.",
                },
                {
                  icon: Repeat,
                  title: "3. Implementation",
                  content: "I wire the tools into the repo you already have, in small changes.",
                },
                {
                  icon: Users,
                  title: "4. Training & Support",
                  content: "I walk the team through the pipeline and leave notes for the next change.",
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

        <section ref={sectionRef} className="py-24 bg-[#F8F9FA] overflow-hidden">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="container mx-auto px-4 text-center mb-12"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">DevOps Tools I Use</h2>
            <p className="text-xl text-gray-600">
              These are the tools I use when they fit the job.
            </p>
          </motion.div>

          <div className="relative w-full">
            <div className="absolute left-0 top-0 w-24 h-full bg-gradient-to-r from-[#F8F9FA] to-transparent z-10" />
            <div className="absolute right-0 top-0 w-24 h-full bg-gradient-to-l from-[#F8F9FA] to-transparent z-10" />

            <motion.div
              initial={{ x: 0 }}
              animate={{ x: "-50%" }}
              transition={{
                duration: 30,
                repeat: Number.POSITIVE_INFINITY,
                ease: "linear",
              }}
              className="flex items-center space-x-16 whitespace-nowrap py-8"
            >
              {technologies.concat(technologies).map((tech, index) => (
                <div
                  key={`${tech.name}-${index}`}
                  className="flex-shrink-0 h-20 w-[200px] transition-all duration-300 hover:scale-110"
                >
                  <div className="flex flex-col items-center gap-2">
                    <img
                      src={tech.logo || "/placeholder.svg"}
                      alt={`${tech.name} logo`}
                      className="w-16 h-16 object-contain"
                    />
                    <span className="text-sm font-medium text-gray-600">{tech.name}</span>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </section>

        <motion.section className="py-24 bg-white" initial="initial" animate="animate" variants={staggerChildren}>
          <div className="container mx-auto px-4 text-center">
            <motion.h2 className="text-3xl font-bold mb-8" variants={fadeInUp}>
              If the release still needs you in the room, start there.
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
                    question: "What DevOps tools do you use?",
                    answer:
                      "GitLab CI or Jenkins, Docker, Kubernetes when you already need it, Ansible, and Terraform. I pick what fits the stack you have.",
                  },
                  {
                    question: "How long until the team can ship without me?",
                    answer:
                      "A first pipeline is weeks, not a six-month program. After that it's your team using it.",
                  },
                  {
                    question: "How do you tell if it worked?",
                    answer:
                      "How often you ship, how long a change takes, and how often it fails. I write those down before and after.",
                  },
                  {
                    question: "Does this only work at a software company?",
                    answer:
                      "If you ship software, yes. The industry doesn't change the pipeline.",
                  },
                  {
                    question: "Where does security fit?",
                    answer:
                      "Security checks go in the pipeline. Dependency scans, and secrets that never land in the log.",
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