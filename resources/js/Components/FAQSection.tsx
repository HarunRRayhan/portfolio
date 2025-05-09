"use client"

import { motion } from "framer-motion"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/Components/ui/accordion"
import { Button } from "@/Components/ui/button"
import { MessageCircle } from "lucide-react"
import { Link } from "@inertiajs/react"
import { getImageUrl } from "../lib/imageUtils"

const faqs = [
  {
    question: "What is Harun's expertise in AWS and cloud architecture?",
    answer:
      "With 12 AWS certifications and over 7 years of AWS experience, I specialize in designing and implementing scalable cloud architectures. I've successfully reduced cloud costs by 30-40% while improving performance for various organizations. My expertise includes serverless architecture, containerization, and implementing infrastructure as code (IaC) using Terraform and AWS CDK.",
  },
  {
    question: "How does Harun approach DevOps and CI/CD implementation?",
    answer:
      "I implement robust CI/CD pipelines using tools like Jenkins, GitHub Actions, and AWS CodePipeline. My approach focuses on automation, continuous testing, and infrastructure as code. I've helped teams achieve 3x faster deployment cycles and 99.9% uptime through effective DevOps practices.",
  },
  {
    question: "What experience does Harun have with containerization and Kubernetes?",
    answer:
      "As a certified Kubernetes administrator, I have extensive experience orchestrating containerized applications. I've implemented and managed Kubernetes clusters on AWS EKS, handling microservices architectures serving millions of requests. I also work with Docker for containerization and implement container security best practices.",
  },
  {
    question: "Can Harun help with cloud cost optimization?",
    answer:
      "Yes, I specialize in cloud cost optimization. I've helped multiple organizations reduce their AWS costs by 30-40% through right-sizing instances, implementing auto-scaling, utilizing spot instances, and optimizing resource usage. I also implement FinOps practices for long-term cost management.",
  },
  {
    question: "What programming languages does Harun work with?",
    answer:
      "I'm proficient in multiple programming languages including Python, Go, Node.js, and PHP (Laravel). I use these languages for backend development, automation scripts, and cloud-native applications. My polyglot approach allows me to choose the best tool for specific use cases.",
  },
  {
    question: "How does Harun handle application security?",
    answer:
      "Security is integral to my work. I implement security best practices including IAM policies, network security, encryption at rest and in transit, and security compliance. I also have experience with AWS security services and implementing security automation in CI/CD pipelines.",
  },
  {
    question: "What is Harun's experience with infrastructure as code (IaC)?",
    answer:
      "I'm an expert in infrastructure as code using Terraform and AWS CDK. I've implemented IaC for complete cloud infrastructures, reducing deployment times from days to hours and ensuring consistency across environments. I also maintain infrastructure version control and implement automated testing for infrastructure code.",
  },
  {
    question: "How does Harun approach system monitoring and observability?",
    answer:
      "I implement comprehensive monitoring solutions using tools like AWS CloudWatch, Prometheus, and Grafana. My approach includes setting up automated alerts, creating detailed dashboards, and implementing logging strategies. This ensures high availability and quick problem resolution.",
  },
  {
    question: "What is Harun's experience with serverless architecture?",
    answer:
      "I have extensive experience building serverless applications using AWS Lambda, API Gateway, and other AWS serverless services. I've helped organizations reduce operational overhead and improve scalability through serverless architectures, while implementing best practices for serverless security and performance optimization.",
  },
  {
    question: "How does Harun contribute to team development and mentoring?",
    answer:
      "As an AWS Community Builder and technical leader, I actively mentor team members in cloud and DevOps practices. I conduct workshops, create documentation, and share knowledge through blog posts and presentations. I believe in building strong, collaborative teams that can deliver high-quality solutions.",
  },
]

export function FAQSection() {
  return (
    <section className="py-20 pb-32 bg-gray-50">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Common questions about my expertise, experience, and approach to software engineering and cloud
            architecture.
          </p>
        </motion.div>

        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <Accordion type="single" collapsible className="w-full space-y-4">
              {faqs.map((faq, index) => (
                <AccordionItem
                  key={index}
                  value={`item-${index}`}
                  className="bg-white rounded-lg shadow-sm border border-gray-200"
                >
                  <AccordionTrigger className="px-6 text-left hover:no-underline">
                    <h3 className="text-lg font-semibold text-gray-900">{faq.question}</h3>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-6">
                    <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mt-12 text-center"
          >
            <Link href="/contact">
              <Button
                size="lg"
                className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white transition-all duration-300 group"
              >
                <MessageCircle className="w-5 h-5 mr-2 group-hover:animate-bounce" />
                Not covered your question? Ask Harun
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  )
} 