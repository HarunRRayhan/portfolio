"use client"

import React, { useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"
import { ServiceHero } from "@/Components/ServiceHero"
import { Button } from "@/Components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card/index"
import { 
  Cloud, 
  Server, 
  Lock, 
  ArrowRight, 
  CheckCircle, 
  BarChart, 
  Users
} from "lucide-react"
import { Link } from "@inertiajs/react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/Components/ui/accordion"
import { getImageUrl } from "@/lib/imageUtils"

const technologies = [
  { name: "AWS", logo: getImageUrl("/images/logos/cloud-arch/aws-logo.svg") },
  { name: "Azure", logo: getImageUrl("/images/logos/cloud-arch/azure-logo.svg") },
  { name: "Google Cloud", logo: getImageUrl("/images/logos/cloud-arch/gcp-logo.svg") },
  {
    name: "Kubernetes",
    logo: getImageUrl("/images/logos/cloud-arch/kubernetes-logo.svg"),
  },
  { name: "Docker", logo: getImageUrl("/images/logos/cloud-arch/docker-logo.svg") },
  { name: "Terraform", logo: getImageUrl("/images/logos/cloud-arch/terraform-logo.svg") },
  { name: "Ansible", logo: getImageUrl("/images/logos/cloud-arch/ansible-logo.svg") },
  { name: "Jenkins", logo: getImageUrl("/images/logos/cloud-arch/jenkins-logo.svg") },
]

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 },
}

const staggerChildren = {
  animate: { transition: { staggerChildren: 0.1 } },
}

export default function CloudArchitecturePage() {
  const [isVisible, setIsVisible] = useState(false)
  const sectionRef = useRef(null)

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
          icon={Cloud}
          title="Cloud Architecture"
          description="I design the AWS layout: accounts, network, and the services the app actually needs."
          backgroundImage="/service-assets/cloud-architecture/hero.jpg"
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
                  icon: Cloud,
                  title: "More traffic, same app",
                  content: "I design the layout so more traffic means more capacity, not a rewrite.",
                },
                {
                  icon: Server,
                  title: "The bill",
                  content:
                    "I stop paying for capacity the app isn't using.",
                },
                {
                  icon: Lock,
                  title: "Close the wide paths",
                  content:
                    "IAM, network boundaries, and the logs. I close the paths that are wider than the job.",
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
                  title: "Mostly AWS",
                  content:
                    "I work mostly on AWS. I use Azure or Google Cloud when the account is already there.",
                },
                {
                  title: "Fit to the repo",
                  content:
                    "The diagram starts from the app, not from a catalog of cloud products.",
                },
                {
                  title: "The paths that are too wide",
                  content:
                    "I name the control that's missing. I don't paper over it.",
                },
                {
                  title: "After it ships",
                  content:
                    "After the change I leave monitoring and a note on what still costs more than it should.",
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
                  title: "The account and the bill",
                  content: "I start with the accounts and the bill, then the app that has to keep running.",
                },
                {
                  icon: Cloud,
                  title: "A sketch of the layout",
                  content: "I sketch the accounts, the network, and the services the app actually needs.",
                },
                {
                  icon: Server,
                  title: "Small changes",
                  content: "I apply the layout in small changes, so a bad plan is easy to stop.",
                },
                {
                  icon: Users,
                  title: "The diagram and the alarms",
                  content: "I leave the diagram, the alarms, and a list of what to look at next.",
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
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Technologies I Use</h2>
            <p className="text-xl text-gray-600">These are the tools I use when they fit the job.</p>
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
              whileHover={{ scale: 1.1 }}
              className="group flex items-center space-x-16 whitespace-nowrap py-8"
            >
              {technologies.concat(technologies).map((tech, index) => (
                <div
                  key={`${tech.name}-${index}`}
                  className="flex-shrink-0 h-20 w-[200px] transition-all duration-300 group-hover:scale-110"
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
              If the layout is expensive or fragile, start there.
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
                    question: "Which clouds do you work on?",
                    answer:
                      "Mostly AWS. I use Azure or Google Cloud when the project already lives there, or when one provider is not the whole answer.",
                  },
                  {
                    question: "How do you handle more traffic?",
                    answer:
                      "Auto-scaling and a load balancer where the app needs them, plus caching in front of the database. I don't add a service because it's fashionable.",
                  },
                  {
                    question: "Can you move an existing setup?",
                    answer:
                      "Yes. I write down the downtime, the data check, and how we roll back before anything moves.",
                  },
                  {
                    question: "How do you handle security in the design?",
                    answer:
                      "Encryption, IAM, and a network that isn't one flat open space. I name the control an audit will ask for.",
                  },
                  {
                    question: "What do you do about the bill?",
                    answer:
                      "I cut what you're not using, then look at steady load for a savings plan. Tags so the bill has names on it.",
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
