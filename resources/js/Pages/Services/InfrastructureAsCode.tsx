"use client"

import React, { useEffect, useRef, useState } from "react"
import { Head, Link } from "@inertiajs/react"
import { motion } from "framer-motion"
import { Menubar } from "@/Components/Menubar"
import { Footer } from "@/Components/Footer"
import { ServiceHero } from "@/Components/ServiceHero"
import { Button } from "@/Components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card/index"
import { Server, GitBranch, Repeat, ArrowRight, CheckCircle, BarChart, Users, Code, Cloud, Lock } from "lucide-react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/Components/ui/accordion"
import { getImageUrl } from "@/lib/imageUtils"
import { InfiniteScrollTech } from "@/Components/InfiniteScrollTech"

const technologies = [
  {
    name: "Terraform",
    logo: getImageUrl("/images/logos/tech/terraformio-icon.svg"),
  },
  {
    name: "AWS CloudFormation",
    logo: getImageUrl("/images/logos/aws-cloudformation.svg"),
  },
  {
    name: "AWS CDK",
    logo: getImageUrl("/images/logos/aws-cdk.svg"),
  },
  {
    name: "Ansible",
    logo: getImageUrl("/images/logos/tech/Ansible_logo.svg"),
  },
  {
    name: "Pulumi",
    logo: getImageUrl("/images/logos/tech/logo-on-white.svg"),
  },
  {
    name: "Kubernetes",
    logo: getImageUrl("/images/logos/tech/Kubernetes_logo_without_workmark.svg"),
  },
  {
    name: "Docker",
    logo: getImageUrl("/images/logos/tech/vertical-logo-monochromatic.png"),
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
    name: "Jenkins",
    logo: getImageUrl("/images/logos/tech/Jenkins_logo.svg"),
  },
  {
    name: "Azure Resource Manager",
    logo: getImageUrl("/images/logos/cloud/resource-manager.png"),
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

export default function InfrastructureAsCodePage() {
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
      <Head>
        <title>Infrastructure as Code (IaC) Services | Harun R. Rayhan</title>
        <meta name="description" content="Expert Infrastructure as Code (IaC) services using Terraform, AWS CDK, and other modern tools. Automate your infrastructure deployment and management for better efficiency and reliability." />
        <meta name="keywords" content="Infrastructure as Code, IaC, Terraform, AWS CDK, infrastructure automation, cloud infrastructure, DevOps automation" />
        
        {/* OpenGraph Tags */}
        <meta property="og:title" content="Infrastructure as Code (IaC) Services | Harun R. Rayhan" />
        <meta property="og:description" content="Expert Infrastructure as Code (IaC) services using Terraform, AWS CDK, and other modern tools. Automate your infrastructure deployment and management for better efficiency and reliability." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={window.location.href} />
        
        {/* Twitter Card Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Infrastructure as Code (IaC) Services | Harun R. Rayhan" />
        <meta name="twitter:description" content="Expert Infrastructure as Code (IaC) services using Terraform, AWS CDK, and other modern tools. Automate your infrastructure deployment and management for better efficiency and reliability." />
        
        {/* Canonical URL */}
        <link rel="canonical" href={window.location.href} />

        {/* JSON-LD Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Service",
            "name": "Infrastructure as Code Services",
            "provider": {
              "@type": "Person",
              "name": "Harun R. Rayhan",
              "description": "Infrastructure Automation Expert"
            },
            "serviceType": "Infrastructure Automation",
            "description": "Expert Infrastructure as Code implementation and consulting services",
            "offers": {
              "@type": "Offer",
              "description": "Infrastructure Automation, Terraform Implementation, AWS CDK Solutions"
            },
            "hasOfferCatalog": {
              "@type": "OfferCatalog",
              "name": "Infrastructure as Code Services",
              "itemListElement": [
                {
                  "@type": "Offer",
                  "itemOffered": {
                    "@type": "Service",
                    "name": "Terraform Implementation",
                    "description": "Design and implement infrastructure using HashiCorp Terraform"
                  }
                },
                {
                  "@type": "Offer",
                  "itemOffered": {
                    "@type": "Service",
                    "name": "AWS CDK Solutions",
                    "description": "Develop infrastructure using AWS Cloud Development Kit"
                  }
                },
                {
                  "@type": "Offer",
                  "itemOffered": {
                    "@type": "Service",
                    "name": "Infrastructure Automation",
                    "description": "Automate infrastructure deployment and management"
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
          icon={Server}
          title="Infrastructure as Code"
          description="Implement and manage your infrastructure using modern IaC tools for improved efficiency, consistency, and scalability."
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
              Our Infrastructure as Code Services
            </motion.h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: Code,
                  title: "IaC Implementation",
                  content:
                    "Implement infrastructure as code solutions using tools like Terraform, AWS CloudFormation, or Ansible.",
                },
                {
                  icon: GitBranch,
                  title: "Version Control Integration",
                  content:
                    "Integrate your infrastructure code with version control systems for better collaboration and change tracking.",
                },
                {
                  icon: Cloud,
                  title: "Multi-Cloud IaC",
                  content:
                    "Develop IaC solutions that work across multiple cloud providers for maximum flexibility and portability.",
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
              Why Choose Us for Infrastructure as Code
            </motion.h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[
                {
                  title: "Expertise Across IaC Tools",
                  content:
                    "Our team is proficient in a wide range of IaC tools, ensuring we can recommend and implement the best solution for your needs.",
                },
                {
                  title: "Focus on Best Practices",
                  content:
                    "We implement IaC following industry best practices, ensuring your infrastructure is secure, scalable, and maintainable.",
                },
                {
                  title: "Continuous Integration",
                  content:
                    "We integrate IaC into your CI/CD pipelines, enabling automated testing and deployment of infrastructure changes.",
                },
                {
                  title: "Knowledge Transfer",
                  content:
                    "We provide comprehensive training and documentation to ensure your team can effectively manage and extend your IaC implementation.",
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
              Our Infrastructure as Code Process
            </motion.h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {[
                {
                  icon: BarChart,
                  title: "1. Assessment",
                  content:
                    "We evaluate your current infrastructure and develop an IaC strategy aligned with your business goals.",
                },
                {
                  icon: Code,
                  title: "2. Design",
                  content:
                    "We design your infrastructure as code, focusing on modularity, reusability, and best practices.",
                },
                {
                  icon: GitBranch,
                  title: "3. Implementation",
                  content: "We implement the IaC solution, integrating with your existing systems and processes.",
                },
                {
                  icon: Users,
                  title: "4. Training & Support",
                  content:
                    "We provide comprehensive training and ongoing support to ensure successful adoption of IaC practices.",
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
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Infrastructure as Code Technologies We Use</h2>
            <p className="text-xl text-gray-600">
              We leverage industry-leading IaC tools to implement robust and scalable infrastructure solutions.
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
              Ready to implement Infrastructure as Code?
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
                    question: "What is Infrastructure as Code (IaC)?",
                    answer:
                      "Infrastructure as Code (IaC) is the practice of managing and provisioning computing infrastructure through machine-readable definition files, rather than physical hardware configuration or interactive configuration tools. It allows you to manage your IT infrastructure using configuration files, making it easier to edit and distribute configurations, and ensuring that you provision the same environment every time.",
                  },
                  {
                    question: "What are the benefits of using Infrastructure as Code?",
                    answer:
                      "IaC offers numerous benefits, including: 1) Consistency and reduced errors in infrastructure deployment, 2) Faster provisioning and scaling of infrastructure, 3) Version control and change tracking for infrastructure, 4) Easier collaboration among team members, 5) Improved documentation of infrastructure, 6) Cost reduction through efficient resource utilization, and 7) Enhanced security through consistent application of security policies.",
                  },
                  {
                    question: "Which IaC tools do you work with?",
                    answer:
                      "We work with a variety of IaC tools to suit different needs and environments. Some popular tools we use include Terraform, AWS CloudFormation, Ansible, Puppet, and Chef. We also have experience with newer tools like Pulumi and cloud-specific solutions like Azure Resource Manager. We can help you choose the best tool for your specific requirements and integrate it into your workflow.",
                  },
                  {
                    question: "How do you ensure security in IaC implementations?",
                    answer:
                      "Security is a crucial aspect of our IaC implementations. We incorporate security best practices into our IaC templates, including proper access controls, encryption, and network segmentation. We also use tools to scan IaC code for potential security issues and integrate security checks into the CI/CD pipeline. Additionally, we implement infrastructure monitoring and logging to detect and respond to potential security incidents.",
                  },
                  {
                    question: "Can you integrate IaC with our existing CI/CD pipeline?",
                    answer:
                      "Yes, we specialize in integrating IaC with existing CI/CD pipelines. This integration allows for automated testing and deployment of infrastructure changes alongside your application code. We can work with various CI/CD tools such as Jenkins, GitLab CI, GitHub Actions, and others to ensure seamless integration of your IaC workflows.",
                  },
                  {
                    question: "How long does it typically take to implement an IaC solution?",
                    answer:
                      "The timeline for implementing an IaC solution can vary depending on the complexity of your infrastructure and the scope of the project. A basic implementation might take a few weeks, while more complex, enterprise-wide solutions could take several months. We work closely with your team to develop a phased approach, often starting with a pilot project to demonstrate value quickly before expanding to your full infrastructure.",
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