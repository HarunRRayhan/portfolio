"use client"

import React, { useEffect, useRef, useState } from "react"
import { Head, Link } from "@inertiajs/react"
import { motion } from "framer-motion"
import { Menubar } from "@/Components/Menubar"
import { Footer } from "@/Components/Footer"
import { ServiceHero } from "@/Components/ServiceHero"
import { Button } from "@/Components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card/index"
import { Code, GitBranch, Repeat, ArrowRight, CheckCircle, Users } from "lucide-react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/Components/ui/accordion"

const technologies = [
  {
    name: "Jenkins",
    logo: "https://upload.wikimedia.org/wikipedia/commons/e/e9/Jenkins_logo.svg",
  },
  {
    name: "Docker",
    logo: "https://www.docker.com/wp-content/uploads/2022/03/vertical-logo-monochromatic.png",
  },
  {
    name: "Kubernetes",
    logo: "https://upload.wikimedia.org/wikipedia/commons/3/39/Kubernetes_logo_without_workmark.svg",
  },
  {
    name: "Terraform",
    logo: "https://www.vectorlogo.zone/logos/terraformio/terraformio-icon.svg",
  },
  {
    name: "AWS",
    logo: "https://upload.wikimedia.org/wikipedia/commons/9/93/Amazon_Web_Services_Logo.svg",
  },
  {
    name: "GitHub Actions",
    logo: "https://github.githubassets.com/images/modules/site/features/actions-icon-actions.svg",
  },
  {
    name: "Ansible",
    logo: "https://upload.wikimedia.org/wikipedia/commons/2/24/Ansible_logo.svg",
  },
  {
    name: "Prometheus",
    logo: "https://upload.wikimedia.org/wikipedia/commons/3/38/Prometheus_software_logo.svg",
  },
  {
    name: "Grafana",
    logo: "https://upload.wikimedia.org/wikipedia/commons/3/3b/Grafana_icon.svg",
  },
  {
    name: "GitLab",
    logo: "https://about.gitlab.com/images/press/logo/svg/gitlab-icon-rgb.svg",
  },
  {
    name: "Puppet",
    logo: "https://upload.wikimedia.org/wikipedia/commons/b/bd/Puppet_transparent_logo.svg",
  },
  {
    name: "Chef",
    logo: "https://upload.wikimedia.org/wikipedia/commons/8/8a/Chef_logo.svg",
  },
  {
    name: "Nagios",
    logo: "https://www.nagios.org/wp-content/uploads/2015/05/Nagios-Logo.jpg",
  },
  {
    name: "Splunk",
    logo: "https://www.splunk.com/content/dam/splunk-blogs/images/2017/02/splunk-logo.png",
  },
  {
    name: "ELK Stack",
    logo: "https://static-www.elastic.co/v3/assets/bltefdd0b53724fa2ce/blt36f2da8d650732a0/5d0823c3d8ff351753cbc99f/logo-elastic-outlined-black.svg",
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

export default function DevOpsPage() {
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
      <Head title="DevOps Implementation" />
      <main className="flex flex-col min-h-screen">
        <Menubar />
        <ServiceHero
          icon={Code}
          title="DevOps Implementation"
          description="Streamline your development and operations with cutting-edge DevOps practices and tools."
        />
        <motion.section className="py-24 bg-white" initial="initial" animate="animate" variants={staggerChildren}>
          <div className="container mx-auto px-4">
            <motion.h2 className="text-3xl font-bold text-center mb-12" variants={fadeInUp}>
              Our DevOps Implementation Services
            </motion.h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: GitBranch,
                  title: "CI/CD Pipeline Setup",
                  content:
                    "Implement robust Continuous Integration and Continuous Deployment pipelines for faster, more reliable releases.",
                },
                {
                  icon: Code,
                  title: "Infrastructure as Code",
                  content:
                    "Automate your infrastructure provisioning and management using tools like Terraform and Ansible.",
                },
                {
                  icon: Repeat,
                  title: "Continuous Monitoring",
                  content:
                    "Set up comprehensive monitoring and alerting systems to ensure optimal performance and quick issue resolution.",
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
              Why Choose Us for DevOps Implementation
            </motion.h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[
                {
                  title: "Expertise Across Tools",
                  content:
                    "Our team is proficient in a wide range of DevOps tools and practices, ensuring the best fit for your needs.",
                },
                {
                  title: "Tailored Solutions",
                  content:
                    "We design DevOps implementations that are specifically tailored to your business goals and existing workflows.",
                },
                {
                  title: "Focus on Automation",
                  content:
                    "We prioritize automation to increase efficiency, reduce errors, and free up your team for more valuable tasks.",
                },
                {
                  title: "Continuous Improvement",
                  content:
                    "We implement feedback loops and metrics to ensure your DevOps practices evolve with your business needs.",
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
              Our DevOps Implementation Process
            </motion.h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {[
                {
                  icon: GitBranch,
                  title: "1. Assessment",
                  content: "We evaluate your current processes and identify areas for DevOps improvement.",
                },
                {
                  icon: Code,
                  title: "2. Strategy",
                  content: "We develop a tailored DevOps strategy aligned with your business objectives.",
                },
                {
                  icon: Repeat,
                  title: "3. Implementation",
                  content: "We implement DevOps practices and tools, focusing on automation and integration.",
                },
                {
                  icon: Users,
                  title: "4. Training & Support",
                  content: "We provide comprehensive training and ongoing support to ensure successful adoption.",
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

        <section ref={sectionRef} className="py-24 bg-[#F8F9FA] overflow-hidden">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="container mx-auto px-4 text-center mb-12"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">DevOps Tools We Use</h2>
            <p className="text-xl text-gray-600">
              We leverage industry-leading tools to implement robust DevOps practices.
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
              Ready to implement DevOps in your organization?
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
                    question: "What DevOps tools do you use?",
                    answer:
                      "We use a wide range of DevOps tools, including but not limited to Jenkins, GitLab CI/CD, Docker, Kubernetes, Ansible, and Terraform. We'll help you choose and implement the best tools for your specific needs and existing technology stack.",
                  },
                  {
                    question: "How long does it take to implement DevOps practices?",
                    answer:
                      "The timeline for implementing DevOps practices varies depending on the size and complexity of your organization. Typically, initial implementation can take 3-6 months, with ongoing optimization and cultural shifts continuing beyond that. We'll work with you to create a tailored implementation plan.",
                  },
                  {
                    question: "How do you measure the success of DevOps implementation?",
                    answer:
                      "We measure success through various metrics, including deployment frequency, lead time for changes, mean time to recovery (MTTR), and change failure rate. We'll also look at team satisfaction and collaboration improvements. We'll work with you to establish baseline metrics and track improvements over time.",
                  },
                  {
                    question: "Can DevOps practices be implemented in a non-tech company?",
                    answer:
                      "While DevOps originated in the tech industry, its principles can be applied to any organization that develops or maintains software, regardless of the industry. We have experience implementing DevOps practices in various sectors, including finance, healthcare, and manufacturing.",
                  },
                  {
                    question: "How does DevOps impact security?",
                    answer:
                      "DevOps and security go hand-in-hand in what's often called DevSecOps. By integrating security practices into the DevOps workflow, we can improve your overall security posture. This includes implementing automated security testing, continuous monitoring, and rapid response to vulnerabilities. The result is a more secure development and deployment process.",
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