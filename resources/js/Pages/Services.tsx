"use client"

import React from "react"
import { Head } from "@inertiajs/react"
import { Menubar } from "@/Components/Menubar"
import { Footer } from "@/Components/Footer"
import { Button } from "@/Components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/Components/ui/card/index"
import { ArrowRight, Cloud, Code, Database, Lock, Server, Zap, MessageSquare } from "lucide-react"
import { Link } from "@inertiajs/react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/Components/ui/accordion"

const services = [
  {
    icon: Cloud,
    title: "Cloud Architecture",
    description:
      "Design and implement scalable, secure, and cost-effective cloud solutions tailored to your business needs.",
    link: "/services/cloud-architecture",
  },
  {
    icon: Code,
    title: "DevOps Implementation",
    description: "Streamline your development and operations with cutting-edge DevOps practices and tools.",
    link: "/services/devops",
  },
  {
    icon: Database,
    title: "Database Optimization",
    description:
      "Optimize your database performance, security, and scalability for improved application responsiveness.",
    link: "/services/database-optimization",
  },
  {
    icon: Lock,
    title: "Security Consulting",
    description: "Enhance your cloud and application security with expert consulting and implementation services.",
    link: "/services/security-consulting",
  },
  {
    icon: Server,
    title: "Infrastructure as Code",
    description: "Implement and manage your infrastructure using modern IaC tools like Terraform and AWS CDK.",
    link: "/services/infrastructure-as-code",
  },
  {
    icon: Zap,
    title: "Performance Optimization",
    description:
      "Boost your application and infrastructure performance with expert analysis and optimization techniques.",
    link: "/services/performance-optimization",
  },
]

const faqs = [
  {
    question: "What cloud platforms do you specialize in?",
    answer:
      "We specialize in AWS (Amazon Web Services), but also have expertise in other major cloud platforms such as Microsoft Azure and Google Cloud Platform. Our team is certified in multiple AWS domains, ensuring we can provide comprehensive solutions across the entire AWS ecosystem.",
  },
  {
    question: "How can DevOps practices benefit my business?",
    answer:
      "DevOps practices can significantly benefit your business by improving collaboration between development and operations teams, accelerating software delivery, increasing reliability, and reducing time-to-market. Our DevOps implementation services focus on automating processes, implementing continuous integration and delivery (CI/CD), and fostering a culture of shared responsibility and continuous improvement.",
  },
  {
    question: "What types of database optimization services do you offer?",
    answer:
      "Our database optimization services cover a wide range of areas including query performance tuning, indexing strategies, data modeling, replication setup, and scalability planning. We work with various database systems including SQL databases like MySQL and PostgreSQL, as well as NoSQL databases like MongoDB and DynamoDB.",
  },
  {
    question: "How do you approach cloud security in your projects?",
    answer:
      "We take a comprehensive approach to cloud security, incorporating best practices at every level of the stack. This includes implementing robust identity and access management (IAM) policies, encrypting data at rest and in transit, setting up virtual private clouds (VPCs) with proper network segmentation, and utilizing cloud-native security services. We also conduct regular security audits and help implement compliance frameworks like GDPR, HIPAA, and PCI-DSS.",
  },
  {
    question: "What is Infrastructure as Code (IaC) and why is it important?",
    answer:
      "Infrastructure as Code (IaC) is the practice of managing and provisioning computing infrastructure through machine-readable definition files, rather than physical hardware configuration or interactive configuration tools. It's important because it allows for consistent, version-controlled, and repeatable infrastructure deployments, reducing human error and increasing efficiency. We specialize in tools like Terraform and AWS CloudFormation to implement IaC solutions.",
  },
  {
    question: "How can your performance optimization services improve my application?",
    answer:
      "Our performance optimization services can improve your application in several ways. We conduct thorough performance audits to identify bottlenecks, optimize database queries and application code, implement caching strategies, and fine-tune server configurations. We also leverage cloud services for auto-scaling and load balancing to ensure your application performs well under varying loads. The result is faster response times, improved user experience, and more efficient resource utilization.",
  },
]

export default function Services() {
  return (
    <>
      <Head title="Services" />
      <main className="flex flex-col min-h-screen">
        <Menubar />
        <div className="flex-grow">
          <section className="py-24 bg-gradient-to-br from-[#86D2F1] via-[#7C3AED] to-[#8B5CF6]">
            <div className="container mx-auto px-4">
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 text-center">Our Services</h1>
              <p className="text-xl text-white/90 max-w-3xl mx-auto text-center mb-12">
                Elevate your business with our comprehensive range of software engineering and cloud services.
              </p>
            </div>
          </section>

          <section className="py-24 bg-white">
            <div className="container mx-auto px-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {services.map((service, index) => (
                  <Card key={index} className="flex flex-col">
                    <CardHeader>
                      <div className="w-12 h-12 rounded-lg bg-[#7C3AED] bg-opacity-10 flex items-center justify-center mb-4">
                        <service.icon className="w-6 h-6 text-[#7C3AED]" />
                      </div>
                      <CardTitle>{service.title}</CardTitle>
                      <CardDescription>{service.description}</CardDescription>
                    </CardHeader>
                    <CardFooter className="mt-auto">
                      <Link href={service.link}>
                        <Button variant="outline" className="w-full">
                          Learn More
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </Link>
                    </CardFooter>
                  </Card>
                ))}
              </div>
              <div className="mt-16 text-center">
                <Link href="/contact">
                  <Button
                    variant="outline"
                    size="lg"
                    className="bg-white text-[#7C3AED] hover:bg-[#7C3AED] hover:text-white border-[#7C3AED] transition-all duration-300"
                  >
                    <MessageSquare className="w-5 h-5 mr-2" />
                    Is the service you're looking for missing? We might do it. Send us a message.
                  </Button>
                </Link>
              </div>
            </div>
          </section>

          <section className="py-24 bg-gray-50">
            <div className="container mx-auto px-4">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-12 text-center">
                Frequently Asked Questions
              </h2>
              <Accordion type="single" collapsible className="max-w-3xl mx-auto">
                {faqs.map((faq, index) => (
                  <AccordionItem key={index} value={`item-${index}`}>
                    <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
                    <AccordionContent>{faq.answer}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </section>
        </div>
        <Footer />
      </main>
    </>
  )
} 