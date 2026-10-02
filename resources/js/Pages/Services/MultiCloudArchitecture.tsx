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
                  title: "Only when one cloud isn't enough",
                  content:
                    "I split the work across clouds only when one provider is not the whole answer.",
                },
                {
                  icon: Network,
                  title: "How the two sides talk",
                  content:
                    "The two sides need a clear way to talk, and a failure on one side shouldn't take the other down silently.",
                },
                {
                  icon: Shield,
                  title: "One place to see both",
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
              What you get
            </motion.h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[
                {
                  title: "AWS, and the cloud you already use",
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
                  title: "The failure you cannot accept",
                  content:
                    "I start from the failure you cannot accept, then decide if a second cloud helps.",
                },
                {
                  icon: Code,
                  title: "What lives where",
                  content:
                    "You get a diagram of what lives where, and how the two sides talk.",
                },
                {
                  icon: Cloud,
                  title: "Both sides in code",
                  content:
                    "I put both sides in code, so the split isn't a pile of console clicks.",
                },
                {
                  icon: Users,
                  title: "Which cloud failed",
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
              Questions people ask
            </motion.h2>
            <motion.div variants={fadeInUp}>
              <Accordion type="single" collapsible className="max-w-3xl mx-auto">
                {[
                  {
                    question: "When is more than one cloud worth it?",
                    answer:
                      "A second cloud helps when one provider is a failure you cannot accept. It also adds a bill and a network between them. I only recommend it for that reason.",
                  },
                  {
                    question: "How do you handle security on both clouds?",
                    answer:
                      "The same idea for access on both sides, encryption between them, and one place that sees both.",
                  },
                  {
                    question: "What if the path between clouds is slow?",
                    answer:
                      "I measure the path that crosses clouds. If that hop is the slow part, the split was the wrong shape.",
                  },
                  {
                    question: "How do you read two bills?",
                    answer:
                      "One view of both bills, and a reason each workload sits where it sits.",
                  },
                  {
                    question: "How do you keep data in sync across clouds?",
                    answer:
                      "I name what has to be copied, how fresh it has to be, and what you do when the copy falls behind.",
                  },
                  {
                    question: "Which tools do you use for more than one cloud?",
                    answer:
                      "Terraform for both sides, and Prometheus or Grafana if you want one set of graphs. Kubernetes only if you're already running it.",
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