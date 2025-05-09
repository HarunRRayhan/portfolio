'use client'

import { Menubar } from "@/Components/Menubar"
import { Footer } from "@/Components/Footer"
import { ServiceHero } from "@/Components/ServiceHero"
import { Button } from "@/Components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card"
import { Zap, GitBranch, Repeat, ArrowRight, CheckCircle, BarChart, Users, Code, Cloud } from 'lucide-react'
import { Link, Head } from '@inertiajs/react'
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
    logo: getImageUrl("/images/logos/tech/circleci-logo-stacked-fb-657e221fda1646a7e652c09c9fbfb2b0feb5d710089bb4d8e8c759d37a832694.png"),
  },
  {
    name: "Travis CI",
    logo: getImageUrl("/images/logos/tech/TravisCI-Full-Color.png"),
  },
  {
    name: "AWS CodePipeline",
    logo: getImageUrl("/images/logos/tech/console_codepipeline_icon.0c5de384dc60b71dae9d780b0c572d5deb9e3f0a.png"),
  },
  {
    name: "Azure DevOps",
    logo: getImageUrl("/images/logos/cloud/devops.png"),
  },
  {
    name: "Docker",
    logo: getImageUrl("/images/logos/tech/vertical-logo-monochromatic.png"),
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

export default function AutomatedDeployment() {
  return (
    <>
      <Head>
        <title>Automated Deployment & CI/CD Services | Harun R. Rayhan</title>
        <meta name="description" content="Expert automated deployment and CI/CD implementation services. Streamline your software delivery pipeline with efficient automation and reliable deployment processes." />
        <meta name="keywords" content="automated deployment, CI/CD, continuous integration, continuous deployment, DevOps automation, deployment pipeline, Jenkins, GitLab CI, GitHub Actions" />
        
        {/* OpenGraph Tags */}
        <meta property="og:title" content="Automated Deployment & CI/CD Services | Harun R. Rayhan" />
        <meta property="og:description" content="Expert automated deployment and CI/CD implementation services. Streamline your software delivery pipeline with efficient automation and reliable deployment processes." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={window.location.href} />
        
        {/* Twitter Card Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Automated Deployment & CI/CD Services | Harun R. Rayhan" />
        <meta name="twitter:description" content="Expert automated deployment and CI/CD implementation services. Streamline your software delivery pipeline with efficient automation and reliable deployment processes." />
        
        {/* Canonical URL */}
        <link rel="canonical" href={window.location.href} />

        {/* JSON-LD Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Service",
            "name": "Automated Deployment Services",
            "provider": {
              "@type": "Person",
              "name": "Harun R. Rayhan",
              "description": "DevOps & CI/CD Expert"
            },
            "serviceType": "DevOps Services",
            "description": "Expert automated deployment and CI/CD implementation services",
            "offers": {
              "@type": "Offer",
              "description": "CI/CD Implementation, Deployment Automation, Pipeline Optimization"
            },
            "hasOfferCatalog": {
              "@type": "OfferCatalog",
              "name": "Automated Deployment Services",
              "itemListElement": [
                {
                  "@type": "Offer",
                  "itemOffered": {
                    "@type": "Service",
                    "name": "CI/CD Implementation",
                    "description": "Set up and configure continuous integration and deployment pipelines"
                  }
                },
                {
                  "@type": "Offer",
                  "itemOffered": {
                    "@type": "Service",
                    "name": "Deployment Automation",
                    "description": "Automate software deployment processes for reliability and efficiency"
                  }
                },
                {
                  "@type": "Offer",
                  "itemOffered": {
                    "@type": "Service",
                    "name": "Pipeline Optimization",
                    "description": "Optimize CI/CD pipelines for faster and more reliable deployments"
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
          icon={GitBranch}
          title="Automated Deployment"
          description="Implement automated deployment pipelines for faster and more reliable software delivery."
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
              Our Automated Deployment Services
            </motion.h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: GitBranch,
                  title: "Continuous Integration",
                  content: "Set up automated build and test processes to catch issues early and improve code quality.",
                },
                {
                  icon: Zap,
                  title: "Continuous Delivery",
                  content:
                    "Automate the deployment process to ensure reliable and consistent releases to production environments.",
                },
                {
                  icon: Repeat,
                  title: "Pipeline Optimization",
                  content:
                    "Continuously improve your CI/CD pipelines for faster builds, deployments, and more efficient workflows.",
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
              Why Choose Us for Automated Deployment
            </motion.h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[
                {
                  title: "Tool Expertise",
                  content:
                    "We have deep expertise in a wide range of CI/CD tools and can help you choose and implement the best solution for your needs.",
                },
                {
                  title: "Custom Workflows",
                  content:
                    "We design and implement custom CI/CD workflows tailored to your specific development and deployment processes.",
                },
                {
                  title: "Security Integration",
                  content:
                    "We integrate security checks and compliance measures into your CI/CD pipeline to ensure secure deployments.",
                },
                {
                  title: "Scalable Solutions",
                  content:
                    "Our CI/CD implementations are designed to scale with your organization, handling increased complexity and volume over time.",
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
              Our Automated Deployment Process
            </motion.h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {[
                {
                  icon: BarChart,
                  title: "1. Assessment",
                  content:
                    "We evaluate your current development and deployment processes to identify areas for automation and improvement.",
                },
                {
                  icon: Code,
                  title: "2. Design",
                  content: "We design a CI/CD pipeline tailored to your specific needs and technology stack.",
                },
                {
                  icon: Cloud,
                  title: "3. Implementation",
                  content:
                    "We set up and configure the chosen CI/CD tools and integrate them with your existing systems.",
                },
                {
                  icon: Users,
                  title: "4. Training & Support",
                  content:
                    "We provide comprehensive training and ongoing support to ensure successful adoption of CI/CD practices.",
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
              Ready to automate your deployment process?
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
                    question: "What is CI/CD and why is it important?",
                    answer:
                      "CI/CD stands for Continuous Integration and Continuous Delivery/Deployment. It's a set of practices that automate the process of building, testing, and deploying software. CI/CD is important because it helps teams deliver high-quality software faster and more reliably, reducing the risk of errors and improving overall efficiency.",
                  },
                  {
                    question: "How long does it take to implement a CI/CD pipeline?",
                    answer:
                      "The time to implement a CI/CD pipeline can vary depending on the complexity of your project and your current infrastructure. A basic pipeline can be set up in a few days, while more complex setups might take a few weeks. We work closely with your team to ensure a smooth implementation and knowledge transfer throughout the process.",
                  },
                  {
                    question: "Can you integrate CI/CD with our existing tools and workflows?",
                    answer:
                      "Yes, we design CI/CD pipelines to integrate seamlessly with your existing tools and workflows. Whether you're using specific version control systems, project management tools, or deployment environments, we can create a pipeline that fits into your current processes while improving efficiency and reliability.",
                  },
                  {
                    question: "How do you ensure security in CI/CD pipelines?",
                    answer:
                      "Security is a crucial aspect of our CI/CD implementations. We incorporate security best practices such as secret management, access control, and vulnerability scanning into the pipeline. We also integrate security testing tools to catch potential issues early in the development process and ensure that only approved, secure code makes it to production.",
                  },
                  {
                    question: "What are the benefits of automated deployment?",
                    answer:
                      "Automated deployment offers numerous benefits, including: 1) Faster and more frequent releases, 2) Reduced human error in the deployment process, 3) Consistent and repeatable deployments across different environments, 4) Easier rollbacks in case of issues, 5) Improved collaboration between development and operations teams, and 6) More time for developers to focus on building features rather than managing deployments.",
                  },
                  {
                    question: "How do you handle database changes in CI/CD pipelines?",
                    answer:
                      "Handling database changes in CI/CD pipelines is crucial for maintaining data integrity and ensuring smooth deployments. We typically use database migration tools that can be integrated into the CI/CD process. These tools allow version control of database schemas and data, automated testing of migrations, and rollback capabilities. We also implement strategies like blue-green deployments or canary releases to minimize downtime and risk when deploying database changes.",
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