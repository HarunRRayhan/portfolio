import { Menubar } from "@/Components/Menubar"
import { Footer } from "@/Components/Footer"
import { ServiceHero } from "@/Components/ServiceHero"
import { Button } from "@/Components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card"
import { Cloud, Network, Shield, ArrowRight, CheckCircle, BarChart, Users, Code } from 'lucide-react'
import { Link, Head } from '@inertiajs/react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/Components/ui/accordion"
import { motion } from "framer-motion"
import { InfiniteScrollTech } from "@/Components/InfiniteScrollTech"
import { getImageUrl } from "@/lib/imageUtils"

const technologies = [
  {
    name: "Amazon Web Services",
    logo: getImageUrl("/images/logos/cloud/aws-logo.png"),
  },
  {
    name: "Microsoft Azure",
    logo: getImageUrl("/images/logos/cloud/azure-logo.png"),
  },
  {
    name: "Google Cloud Platform",
    logo: getImageUrl("/images/logos/cloud/gcp-logo.svg"),
  },
  {
    name: "Kubernetes",
    logo: getImageUrl("/images/logos/cloud/kubernetes-logo.png"),
  },
  {
    name: "Terraform",
    logo: getImageUrl("/images/logos/cloud/terraform-logo.svg"),
  },
  {
    name: "Docker",
    logo: getImageUrl("/images/logos/cloud/docker-logo.png"),
  },
  {
    name: "Ansible",
    logo: getImageUrl("/images/logos/cloud/ansible-logo.png"),
  },
  {
    name: "HashiCorp Vault",
    logo: getImageUrl("/images/logos/cloud/hashicorp-logo.svg"),
  },
  {
    name: "Prometheus",
    logo: getImageUrl("/images/logos/cloud/prometheus-logo.svg"),
  },
  {
    name: "Grafana",
    logo: getImageUrl("/images/logos/cloud/grafana-logo.svg"),
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

export default function MultiCloudArchitecture() {
  return (
    <>
      <Head>
        <title>Multi-Cloud Architecture Services | Harun R. Rayhan</title>
        <meta name="description" content="Expert multi-cloud architecture and implementation services. Design and manage efficient cloud solutions across AWS, Azure, Google Cloud, and other providers." />
        <meta name="keywords" content="multi-cloud architecture, cloud strategy, hybrid cloud, AWS, Azure, Google Cloud, cloud migration, cloud optimization" />
        
        {/* OpenGraph Tags */}
        <meta property="og:title" content="Multi-Cloud Architecture Services | Harun R. Rayhan" />
        <meta property="og:description" content="Expert multi-cloud architecture and implementation services. Design and manage efficient cloud solutions across AWS, Azure, Google Cloud, and other providers." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={window.location.href} />
        
        {/* Twitter Card Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Multi-Cloud Architecture Services | Harun R. Rayhan" />
        <meta name="twitter:description" content="Expert multi-cloud architecture and implementation services. Design and manage efficient cloud solutions across AWS, Azure, Google Cloud, and other providers." />
        
        {/* Canonical URL */}
        <link rel="canonical" href={window.location.href} />

        {/* JSON-LD Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Service",
            "name": "Multi-Cloud Architecture Services",
            "provider": {
              "@type": "Person",
              "name": "Harun R. Rayhan",
              "description": "Multi-Cloud Architecture Expert"
            },
            "serviceType": "Cloud Architecture",
            "description": "Expert multi-cloud architecture and implementation services",
            "offers": {
              "@type": "Offer",
              "description": "Multi-Cloud Strategy, Cloud Integration, Hybrid Cloud Solutions"
            },
            "hasOfferCatalog": {
              "@type": "OfferCatalog",
              "name": "Multi-Cloud Services",
              "itemListElement": [
                {
                  "@type": "Offer",
                  "itemOffered": {
                    "@type": "Service",
                    "name": "Multi-Cloud Strategy",
                    "description": "Develop comprehensive multi-cloud strategies"
                  }
                },
                {
                  "@type": "Offer",
                  "itemOffered": {
                    "@type": "Service",
                    "name": "Cloud Integration",
                    "description": "Integrate services across multiple cloud providers"
                  }
                },
                {
                  "@type": "Offer",
                  "itemOffered": {
                    "@type": "Service",
                    "name": "Hybrid Cloud Solutions",
                    "description": "Design and implement hybrid cloud architectures"
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
          title="Multi-Cloud Architecture"
          description="Design and implement robust multi-cloud solutions that leverage the best of different cloud providers."
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
              Our Multi-Cloud Architecture Services
            </motion.h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: Cloud,
                  title: "Multi-Cloud Strategy",
                  content:
                    "Develop comprehensive multi-cloud strategies that align with your business goals, ensuring optimal resource utilization across cloud providers.",
                },
                {
                  icon: Network,
                  title: "Cloud Integration",
                  content:
                    "Seamlessly integrate services across multiple cloud providers while maintaining security, performance, and cost-efficiency.",
                },
                {
                  icon: Shield,
                  title: "Unified Management",
                  content:
                    "Implement centralized management and monitoring solutions for your multi-cloud environment, ensuring consistent governance and control.",
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
              Why Choose Us for Multi-Cloud Architecture
            </motion.h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[
                {
                  title: "Cross-Platform Expertise",
                  content:
                    "Our team is certified across AWS, Azure, and Google Cloud Platform, ensuring comprehensive multi-cloud solutions.",
                },
                {
                  title: "Vendor-Neutral Approach",
                  content:
                    "We provide unbiased recommendations based on your specific needs, not vendor preferences.",
                },
                {
                  title: "Risk Mitigation",
                  content:
                    "Reduce vendor lock-in and enhance reliability through strategic distribution of workloads across cloud providers.",
                },
                {
                  title: "Cost Optimization",
                  content:
                    "Leverage the best pricing models and services from each cloud provider to optimize your infrastructure costs.",
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
              Our Multi-Cloud Architecture Process
            </motion.h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {[
                {
                  icon: BarChart,
                  title: "1. Assessment",
                  content:
                    "Evaluate your current infrastructure and requirements to develop an optimal multi-cloud strategy.",
                },
                {
                  icon: Code,
                  title: "2. Design",
                  content:
                    "Create a comprehensive multi-cloud architecture that leverages the strengths of each platform.",
                },
                {
                  icon: Cloud,
                  title: "3. Implementation",
                  content:
                    "Deploy and integrate services across cloud providers with automated infrastructure as code.",
                },
                {
                  icon: Users,
                  title: "4. Management",
                  content:
                    "Provide unified monitoring, optimization, and support across your entire multi-cloud environment.",
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
              Ready to build your multi-cloud infrastructure?
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
                    question: "What are the benefits of a multi-cloud architecture?",
                    answer:
                      "Multi-cloud architecture offers several key benefits: 1) Reduced vendor lock-in and dependency, 2) Ability to leverage the best services from each provider, 3) Enhanced reliability and redundancy, 4) Potential cost savings through provider competition, 5) Geographic flexibility for global deployments, and 6) Improved disaster recovery capabilities.",
                  },
                  {
                    question: "How do you handle security across multiple cloud providers?",
                    answer:
                      "We implement a comprehensive security strategy that includes: 1) Unified identity and access management across providers, 2) Consistent security policies and compliance standards, 3) Centralized monitoring and threat detection, 4) Encrypted data transmission between clouds, 5) Regular security audits and assessments, and 6) Automated security controls and policies enforcement.",
                  },
                  {
                    question: "How do you ensure consistent performance across different cloud providers?",
                    answer:
                      "We maintain consistent performance through: 1) Automated performance monitoring and alerting, 2) Load balancing across providers, 3) Optimized network connectivity and routing, 4) Regular performance benchmarking and optimization, 5) Service-level agreement (SLA) monitoring, and 6) Proactive capacity planning and scaling.",
                  },
                  {
                    question: "How do you manage costs in a multi-cloud environment?",
                    answer:
                      "Cost management in multi-cloud environments involves: 1) Centralized cost monitoring and reporting, 2) Automated resource optimization and scaling, 3) Strategic workload placement based on provider pricing, 4) Reserved capacity planning across providers, 5) Regular cost analysis and optimization recommendations, and 6) Implementation of cost allocation and chargeback mechanisms.",
                  },
                  {
                    question: "How do you handle data synchronization between different cloud providers?",
                    answer:
                      "Data synchronization is managed through: 1) Real-time data replication services, 2) Automated backup and recovery processes, 3) Consistent data governance policies, 4) Optimized data transfer routes, 5) Monitoring of data consistency and integrity, and 6) Implementation of disaster recovery and failover procedures.",
                  },
                  {
                    question: "What tools do you use for multi-cloud management?",
                    answer:
                      "We utilize a variety of tools including: 1) Terraform for infrastructure as code across providers, 2) Kubernetes for container orchestration, 3) HashiCorp Vault for secrets management, 4) Prometheus and Grafana for monitoring, 5) CI/CD tools for automated deployments, and 6) Custom dashboards for unified visibility and control.",
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