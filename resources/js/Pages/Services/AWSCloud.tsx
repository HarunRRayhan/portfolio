import { Menubar } from "@/Components/Menubar"
import { Footer } from "@/Components/Footer"
import { ServiceHero } from "@/Components/ServiceHero"
import { Button } from "@/Components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card"
import { Cloud, Server, Lock, ArrowRight, CheckCircle, BarChart, Users, Code } from 'lucide-react'
import { Link, Head } from '@inertiajs/react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/Components/ui/accordion"
import { motion } from "framer-motion"
import { useEffect, useRef, useState } from "react"
import { InfiniteScrollTech } from "@/Components/InfiniteScrollTech"
import { getImageUrl } from "@/lib/imageUtils"

const technologies = [
  {
    name: "Amazon EC2",
    logo: getImageUrl("/images/logos/aws/ec2-icon.png"),
  },
  {
    name: "Amazon S3",
    logo: getImageUrl("/images/logos/aws/s3-icon.png"),
  },
  {
    name: "Amazon RDS",
    logo: getImageUrl("/images/logos/aws/rds-icon.png"),
  },
  {
    name: "Amazon Lambda",
    logo: getImageUrl("/images/logos/aws/lambda-icon.png"),
  },
  {
    name: "Amazon VPC",
    logo: getImageUrl("/images/logos/aws/vpc-icon.png"),
  },
  {
    name: "Amazon CloudFront",
    logo: getImageUrl("/images/logos/aws/cloudfront-icon.png"),
  },
  {
    name: "AWS IAM",
    logo: getImageUrl("/images/logos/aws/iam-icon.png"),
  },
  {
    name: "Amazon ECS",
    logo: getImageUrl("/images/logos/aws/ecs-icon.png"),
  },
  {
    name: "Amazon EKS",
    logo: getImageUrl("/images/logos/aws/eks-icon.png"),
  },
  {
    name: "AWS CloudFormation",
    logo: getImageUrl("/images/logos/aws/cloudformation-icon.png"),
  },
  {
    name: "Amazon CloudWatch",
    logo: getImageUrl("/images/logos/aws/cloudwatch-icon.png"),
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

export default function AWSCloud() {
  return (
    <>
      <Head>
        <title>AWS Cloud Services & Solutions | Harun R. Rayhan</title>
        <meta name="description" content="Expert AWS cloud solutions and consulting services. Leverage the full power of Amazon Web Services with our certified professionals for scalable, secure, and cost-effective cloud infrastructure." />
        <meta name="keywords" content="AWS cloud services, Amazon Web Services, cloud infrastructure, AWS consulting, cloud migration, AWS security, cloud optimization" />
        
        {/* OpenGraph Tags */}
        <meta property="og:title" content="AWS Cloud Services & Solutions | Harun R. Rayhan" />
        <meta property="og:description" content="Expert AWS cloud solutions and consulting services. Leverage the full power of Amazon Web Services with our certified professionals for scalable, secure, and cost-effective cloud infrastructure." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={window.location.href} />
        
        {/* Twitter Card Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="AWS Cloud Services & Solutions | Harun R. Rayhan" />
        <meta name="twitter:description" content="Expert AWS cloud solutions and consulting services. Leverage the full power of Amazon Web Services with our certified professionals for scalable, secure, and cost-effective cloud infrastructure." />
        
        {/* Canonical URL */}
        <link rel="canonical" href={window.location.href} />

        {/* JSON-LD Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Service",
            "name": "AWS Cloud Services",
            "provider": {
              "@type": "Person",
              "name": "Harun R. Rayhan",
              "description": "AWS Certified Cloud Professional"
            },
            "serviceType": "Cloud Computing Services",
            "description": "Expert AWS cloud solutions and consulting services for businesses",
            "offers": {
              "@type": "Offer",
              "description": "AWS Infrastructure Design, Migration, and Security Services"
            },
            "hasOfferCatalog": {
              "@type": "OfferCatalog",
              "name": "AWS Cloud Services",
              "itemListElement": [
                {
                  "@type": "Offer",
                  "itemOffered": {
                    "@type": "Service",
                    "name": "AWS Infrastructure Design",
                    "description": "Design and implement scalable, secure, and cost-effective AWS cloud infrastructures"
                  }
                },
                {
                  "@type": "Offer",
                  "itemOffered": {
                    "@type": "Service",
                    "name": "AWS Migration",
                    "description": "Seamless migration of applications and infrastructure to AWS"
                  }
                },
                {
                  "@type": "Offer",
                  "itemOffered": {
                    "@type": "Service",
                    "name": "AWS Security & Compliance",
                    "description": "Implementation of robust security measures and compliance standards"
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
          icon={Cloud}
          title="AWS Cloud Services"
          description="Expert AWS cloud solutions to help you leverage the full power of Amazon Web Services for your business needs."
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
              Our AWS Cloud Services
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
              Why Choose Us for AWS Cloud
            </motion.h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[
                {
                  title: "AWS Certified Experts",
                  content:
                    "Our team consists of AWS certified professionals with deep expertise across all AWS services.",
                },
                {
                  title: "Cost Optimization",
                  content:
                    "We implement strategies to optimize your AWS costs while maintaining high performance and reliability.",
                },
                {
                  title: "24/7 Support",
                  content:
                    "We provide round-the-clock monitoring and support to ensure your AWS infrastructure runs smoothly.",
                },
                {
                  title: "Custom Solutions",
                  content:
                    "We design and implement AWS solutions tailored to your specific business requirements and goals.",
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
              Our AWS Cloud Process
            </motion.h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {[
                {
                  icon: BarChart,
                  title: "1. Assessment",
                  content:
                    "We evaluate your current infrastructure and business needs to determine the optimal AWS strategy.",
                },
                {
                  icon: Code,
                  title: "2. Design",
                  content:
                    "We design a comprehensive AWS architecture tailored to your specific requirements and scalability needs.",
                },
                {
                  icon: Cloud,
                  title: "3. Implementation",
                  content:
                    "We deploy and configure your AWS infrastructure, ensuring security, performance, and cost-efficiency.",
                },
                {
                  icon: Users,
                  title: "4. Optimization & Support",
                  content:
                    "We provide ongoing monitoring, optimization, and support to ensure your AWS environment runs at peak efficiency.",
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
              Ready to harness the power of AWS?
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
                    question: "What are the benefits of using AWS for my business?",
                    answer:
                      "AWS offers numerous benefits including scalability, cost-effectiveness, global reach, and access to a wide range of cloud services. It allows businesses to innovate faster, reduce IT costs, and scale their infrastructure as needed. With AWS, you can quickly deploy applications, easily manage your IT resources, and benefit from built-in security features.",
                  },
                  {
                    question: "How do you ensure security in AWS environments?",
                    answer:
                      "We implement a multi-layered security approach in AWS environments. This includes using AWS Identity and Access Management (IAM) for fine-grained access control, implementing network security through Virtual Private Clouds (VPCs) and security groups, encrypting data at rest and in transit, and utilizing AWS security services like GuardDuty and Security Hub. We also follow AWS security best practices and can help with compliance requirements.",
                  },
                  {
                    question: "Can you help migrate our existing infrastructure to AWS?",
                    answer:
                      "Yes, we specialize in AWS migrations. Our process involves assessing your current infrastructure, designing an optimal AWS architecture, planning the migration strategy, and executing the migration with minimal downtime. We use AWS migration tools and best practices to ensure a smooth transition. This includes services like AWS Database Migration Service (DMS) for database migrations and AWS Application Discovery Service to help plan your migration. We also implement strategies to minimize risks and ensure business continuity throughout the migration process.",
                  },
                  {
                    question: "How do you handle cost optimization in AWS?",
                    answer:
                      "Cost optimization is a key focus in our AWS management approach. We employ several strategies including: 1) Right-sizing instances to ensure you're not over-provisioning resources, 2) Utilizing AWS cost management tools like AWS Cost Explorer and AWS Budgets, 3) Implementing auto-scaling to match resource allocation with demand, 4) Leveraging reserved instances and savings plans for predictable workloads, 5) Identifying and removing unused resources, and 6) Continuously monitoring and optimizing your AWS environment for cost-efficiency.",
                  },
                  {
                    question: "Can you help with AWS compliance requirements?",
                    answer:
                      "Absolutely. We have extensive experience in helping businesses meet various compliance requirements in AWS environments. This includes standards such as HIPAA, PCI DSS, GDPR, and SOC 2. We leverage AWS compliance-enabling services and implement best practices to ensure your AWS infrastructure meets necessary regulatory requirements. Our approach includes implementing proper access controls, encryption, logging, and monitoring, as well as assisting with documentation and audit preparation.",
                  },
                  {
                    question: "What ongoing support do you provide for AWS environments?",
                    answer:
                      "We offer comprehensive ongoing support for AWS environments. This includes 24/7 monitoring and alerting, regular security patching and updates, performance optimization, cost management, and troubleshooting. We also provide proactive recommendations for improvements and new AWS features that could benefit your business. Our team stays up-to-date with the latest AWS services and best practices to ensure your environment remains optimized, secure, and aligned with your business goals.",
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