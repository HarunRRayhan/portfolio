import { ServiceHero } from "@/Components/ServiceHero"
import { Button } from "@/Components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card"
import { Cloud, Server, Lock, ArrowRight, CheckCircle, BarChart, Users, Code } from 'lucide-react'
import { Link } from '@inertiajs/react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/Components/ui/accordion"
import { motion } from "framer-motion"
import { useEffect, useRef, useState } from "react"
import { InfiniteScrollTech } from "@/Components/InfiniteScrollTech"
import { getImageUrl } from "@/lib/imageUtils"

const technologies = [
  {
    name: "Amazon EC2",
    logo: getImageUrl("/images/logos/aws/ec2-icon.svg"),
  },
  {
    name: "Amazon S3",
    logo: getImageUrl("/images/logos/aws/s3-icon.svg"),
  },
  {
    name: "Amazon RDS",
    logo: getImageUrl("/images/logos/aws/rds-icon.svg"),
  },
  {
    name: "Amazon Lambda",
    logo: getImageUrl("/images/logos/aws/lambda-icon.svg"),
  },
  {
    name: "Amazon VPC",
    logo: getImageUrl("/images/logos/aws/vpc-icon.svg"),
  },
  {
    name: "Amazon CloudFront",
    logo: getImageUrl("/images/logos/aws/cloudfront-icon.svg"),
  },
  {
    name: "AWS IAM",
    logo: getImageUrl("/images/logos/aws/iam-icon.svg"),
  },
  {
    name: "Amazon ECS",
    logo: getImageUrl("/images/logos/aws/ecs-icon.svg"),
  },
  {
    name: "Amazon EKS",
    logo: getImageUrl("/images/logos/aws/eks-icon.svg"),
  },
  {
    name: "AWS CloudFormation",
    logo: getImageUrl("/images/logos/aws/cloudformation-icon.svg"),
  },
  {
    name: "Amazon CloudWatch",
    logo: getImageUrl("/images/logos/aws/cloudwatch-icon.svg"),
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

export default function AWSCloud({ canonicalUrl }: { canonicalUrl?: string }) {
  return (
    <>
      <main className="flex flex-col min-h-screen">
        <ServiceHero
          icon={Cloud}
          title="AWS Cloud Services"
          description="Accounts, networking, compute, and the managed services around them."
          backgroundImage="/service-assets/aws-cloud/hero.jpg"
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
                  title: "AWS Infrastructure Design",
                  content:
                    "Design and implement scalable, secure, and cost-effective AWS cloud infrastructures tailored to your business needs.",
                },
                {
                  icon: Server,
                  title: "AWS Migration",
                  content:
                    "Seamlessly migrate your existing applications and infrastructure to AWS, ensuring minimal downtime and maximum efficiency.",
                },
                {
                  icon: Lock,
                  title: "AWS Security & Compliance",
                  content:
                    "Implement robust security measures and ensure compliance with industry standards using AWS security services and best practices.",
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
              How I handle AWS Cloud
            </motion.h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[
                {
                  title: "The account you already have",
                  content:
                    "I work in the AWS account you already have: compute, network, and the managed services around them.",
                },
                {
                  title: "Cost Optimization",
                  content:
                    "I implement strategies to optimize your AWS costs while maintaining high performance and reliability.",
                },
                {
                  title: "Alerts you can act on",
                  content:
                    "I set up the alarms and the runbook so a failure pages someone before it becomes an outage story.",
                },
                {
                  title: "Custom Solutions",
                  content:
                    "I design and implement AWS solutions tailored to your specific business requirements and goals.",
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
                  title: "1. Assessment",
                  content:
                    "I evaluate your current infrastructure and business needs to determine the optimal AWS strategy.",
                },
                {
                  icon: Code,
                  title: "2. Design",
                  content:
                    "I design a comprehensive AWS architecture tailored to your specific requirements and scalability needs.",
                },
                {
                  icon: Cloud,
                  title: "3. Implementation",
                  content:
                    "I deploy and configure your AWS infrastructure, ensuring security, performance, and cost-efficiency.",
                },
                {
                  icon: Users,
                  title: "4. Optimization & Support",
                  content:
                    "I provide ongoing monitoring, optimization, and support to ensure your AWS environment runs at peak efficiency.",
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
              Ready to harness the power of AWS?
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
              Frequently Asked Questions
            </motion.h2>
            <motion.div variants={fadeInUp}>
              <Accordion type="single" collapsible className="max-w-3xl mx-auto">
                {[
                  {
                    question: "What are the benefits of using AWS for my business?",
                    answer:
                      "AWS offers numerous benefits including scalability, cost-effectiveness, global reach, and access to a wide range of cloud services. It allows businesses to innovate faster, reduce IT costs, and scale their infrastructure as needed. With AWS, you can quickly deploy applications, easily manage your IT resources, and benefit from built-in security features.",
                  },
                  {
                    question: "How do you ensure security in AWS environments?",
                    answer:
                      "I implement a multi-layered security approach in AWS environments. This includes using AWS Identity and Access Management (IAM) for fine-grained access control, implementing network security through Virtual Private Clouds (VPCs) and security groups, encrypting data at rest and in transit, and utilizing AWS security services like GuardDuty and Security Hub. I also follow AWS security best practices and can help with compliance requirements.",
                  },
                  {
                    question: "Can you help migrate our existing infrastructure to AWS?",
                    answer:
                      "Yes, I specialize in AWS migrations. My process involves assessing your current infrastructure, designing an optimal AWS architecture, planning the migration strategy, and executing the migration with minimal downtime. I use AWS migration tools and best practices to ensure a smooth transition. This includes services like AWS Database Migration Service (DMS) for database migrations and AWS Application Discovery Service to help plan your migration. I also implement strategies to minimize risks and ensure business continuity throughout the migration process.",
                  },
                  {
                    question: "How do you handle cost optimization in AWS?",
                    answer:
                      "Cost optimization is a key focus in my AWS management approach. I employ several strategies including: 1) Right-sizing instances to ensure you're not over-provisioning resources, 2) Utilizing AWS cost management tools like AWS Cost Explorer and AWS Budgets, 3) Implementing auto-scaling to match resource allocation with demand, 4) Leveraging reserved instances and savings plans for predictable workloads, 5) Identifying and removing unused resources, and 6) Continuously monitoring and optimizing your AWS environment for cost-efficiency.",
                  },
                  {
                    question: "Can you help with AWS compliance requirements?",
                    answer:
                      "I can help with HIPAA, PCI DSS, GDPR, and SOC 2. That means access, encryption, logging, and the paperwork an audit will ask for.",
                  },
                  {
                    question: "What ongoing support do you provide for AWS environments?",
                    answer:
                      "After the change, I leave monitoring, a short list of what to patch, and notes on the cost. I do not staff a night desk. The alarms should reach the person who can fix the thing.",
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