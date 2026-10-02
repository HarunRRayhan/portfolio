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
          title="AWS Cloud"
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
                  title: "The accounts and the network",
                  content:
                    "I lay out the accounts, the network, and the services the app actually needs.",
                },
                {
                  icon: Server,
                  title: "The move onto AWS",
                  content:
                    "I move what you already run onto AWS, with a plan for the cutover and the first week after.",
                },
                {
                  icon: Lock,
                  title: "The paths that are too wide",
                  content:
                    "I close the IAM and network paths that are wider than the job, and line up the evidence an audit will ask for.",
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
                  title: "The account you already have",
                  content:
                    "I work in the AWS account you already have: compute, network, and the managed services around them.",
                },
                {
                  title: "The bill",
                  content:
                    "I cut what you're paying for and not using, then check that the app still holds.",
                },
                {
                  title: "Alerts you can act on",
                  content:
                    "I set up the alarms and the runbook so a failure pages someone before it becomes an outage story.",
                },
                {
                  title: "Only what the app needs",
                  content:
                    "I don't add a service because AWS has it. It has to earn a place in the diagram.",
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
                  title: "What runs, what it costs",
                  content:
                    "I look at the account you have: what runs, what it costs, and what fails.",
                },
                {
                  icon: Code,
                  title: "A diagram you can read",
                  content:
                    "You get a diagram of accounts, network, and the services the app needs.",
                },
                {
                  icon: Cloud,
                  title: "A plan, then the change",
                  content:
                    "I apply the change in the account, with a plan you can read first.",
                },
                {
                  icon: Users,
                  title: "Alarms and the bill",
                  content:
                    "I leave alarms, a short patch list, and notes on the cost. I don't staff a night desk.",
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
              If the AWS account is expensive or fragile, start there.
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
                    question: "Why AWS?",
                    answer:
                      "You pay for what you use, and you can add capacity without buying a machine. The useful part is the managed services around the app, not the size of the catalog.",
                  },
                  {
                    question: "How do you handle security on AWS?",
                    answer:
                      "IAM, the network, and encryption in transit and at rest. I add GuardDuty or Security Hub only if they tell you something the logs don't.",
                  },
                  {
                    question: "Can you help migrate our existing infrastructure to AWS?",
                    answer:
                      "Yes. I look at what you run now, write the cutover plan, and check the data before traffic moves.",
                  },
                  {
                    question: "What do you do about the AWS bill?",
                    answer:
                      "I look at what you're paying for and not using, then right-size it or turn it off. A savings plan only for load that is actually steady.",
                  },
                  {
                    question: "Can you help with HIPAA, PCI, or SOC 2?",
                    answer:
                      "I can help with HIPAA, PCI DSS, GDPR, and SOC 2. That means access, encryption, logging, and the paperwork an audit will ask for.",
                  },
                  {
                    question: "What do you leave behind when the AWS work is done?",
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