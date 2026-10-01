import { ServiceHero } from "@/Components/ServiceHero"
import { Button } from "@/Components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card"
import { Cloud, Network, Shield, ArrowRight, CheckCircle, BarChart, Users, Code } from 'lucide-react'
import { Link } from '@inertiajs/react'
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
    logo: getImageUrl("/images/logos/cloud/kubernetes-logo.svg"),
  },
  {
    name: "Terraform",
    logo: getImageUrl("/images/logos/cloud/terraform-logo.svg"),
  },
  {
    name: "Docker",
    logo: getImageUrl("/images/logos/cloud/docker-logo.svg"),
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

export default function MultiCloudArchitecture({ canonicalUrl }: { canonicalUrl?: string }) {
  return (
    <>
      <main className="flex flex-col min-h-screen">
        <ServiceHero
          icon={Cloud}
          title="Multi-Cloud Architecture"
          description="A setup that uses more than one cloud, when AWS alone isn't the whole answer."
          backgroundImage="/service-assets/multi-cloud-architecture/hero.jpg"
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
                  title: "Multi-Cloud Strategy",
                  content:
                    "I split the work across clouds only when one provider is not the whole answer.",
                },
                {
                  icon: Network,
                  title: "Cloud Integration",
                  content:
                    "The two sides need a clear way to talk, and a failure on one side shouldn't take the other down silently.",
                },
                {
                  icon: Shield,
                  title: "Unified Management",
                  content:
                    "One place to see both clouds. Two consoles and no alarm is how these setups rot.",
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
                  title: "Cross-Platform Expertise",
                  content:
                    "I work mostly on AWS, and I use Azure or Google Cloud when the project already lives there.",
                },
                {
                  title: "A reason for the second cloud",
                  content:
                    "If AWS is enough, I say so. A second cloud has to solve a failure you cannot accept.",
                },
                {
                  title: "What fails together",
                  content:
                    "I name what still fails together after the split. A second logo is not a backup.",
                },
                {
                  title: "The bill",
                  content:
                    "I compare the bill on both sides. Cheap on one cloud and expensive to connect is not a win.",
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
                    "I start from the failure you cannot accept, then decide if a second cloud helps.",
                },
                {
                  icon: Code,
                  title: "2. Design",
                  content:
                    "You get a diagram of what lives where, and how the two sides talk.",
                },
                {
                  icon: Cloud,
                  title: "3. Implementation",
                  content:
                    "I put both sides in code, so the split isn't a pile of console clicks.",
                },
                {
                  icon: Users,
                  title: "4. Management",
                  content:
                    "I leave one dashboard and an alarm that names which cloud failed.",
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
              If one cloud is not the whole answer, start there.
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
                    question: "What are the benefits of a multi-cloud architecture?",
                    answer:
                      "Multi-cloud architecture offers several key benefits: 1) Reduced vendor lock-in and dependency, 2) Ability to leverage the best services from each provider, 3) Enhanced reliability and redundancy, 4) Potential cost savings through provider competition, 5) Geographic flexibility for global deployments, and 6) Improved disaster recovery capabilities.",
                  },
                  {
                    question: "How do you handle security across multiple cloud providers?",
                    answer:
                      "I implement a comprehensive security strategy that includes: 1) Unified identity and access management across providers, 2) Consistent security policies and compliance standards, 3) Centralized monitoring and threat detection, 4) Encrypted data transmission between clouds, 5) Regular security audits and assessments, and 6) Automated security controls and policies enforcement.",
                  },
                  {
                    question: "How do you ensure consistent performance across different cloud providers?",
                    answer:
                      "I maintain consistent performance through: 1) Automated performance monitoring and alerting, 2) Load balancing across providers, 3) Optimized network connectivity and routing, 4) Regular performance benchmarking and optimization, 5) Service-level agreement (SLA) monitoring, and 6) Proactive capacity planning and scaling.",
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
                      "I utilize a variety of tools including: 1) Terraform for infrastructure as code across providers, 2) Kubernetes for container orchestration, 3) HashiCorp Vault for secrets management, 4) Prometheus and Grafana for monitoring, 5) CI/CD tools for automated deployments, and 6) Custom dashboards for unified visibility and control.",
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