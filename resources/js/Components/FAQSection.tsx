"use client"

import { motion } from "framer-motion"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/Components/ui/accordion"
import { Button } from "@/Components/ui/button"
import { MessageCircle } from "lucide-react"
import { Link } from "@inertiajs/react"

const faqs = [
  {
    question: "What do you work on in AWS?",
    answer:
      "The account you already have: compute, network, and the managed services around them. Infrastructure changes go through Terraform, and you can read the plan before anything is applied.",
  },
  {
    question: "How do you handle a release?",
    answer:
      "I set up the pipeline that builds, tests, and ships, so a release is a button instead of a checklist. Your team should be able to run it without me in the room.",
  },
  {
    question: "Do you use Kubernetes?",
    answer:
      "When the app already runs that way, usually on EKS. I don't add a cluster for its own sake. Docker is enough for a lot of apps.",
  },
  {
    question: "Can you help with the AWS bill?",
    answer:
      "Yes. I look at what you're paying for and not using, then right-size it or turn it off.",
  },
  {
    question: "Which languages do you write?",
    answer:
      "PHP, mostly Laravel. Python, Go, or Node when the project is already in that language.",
  },
  {
    question: "How do you handle security?",
    answer:
      "IAM, the network, and the logs. I close the paths that are wider than the job, and I put the checks in the pipeline.",
  },
  {
    question: "How do you work with Terraform?",
    answer:
      "I read the modules and the state you already have, make the change, and review the plan before it is applied. You keep the notes for the next change.",
  },
  {
    question: "How do you set up monitoring?",
    answer:
      "Metrics, logs, and an alarm that pages a person. CloudWatch, Prometheus, or Grafana, whichever you already run.",
  },
  {
    question: "When do you use serverless?",
    answer:
      "Lambda and queues, when you want less to patch and a bill that follows the traffic. A function that runs all day is just a server.",
  },
  {
    question: "Do you mentor?",
    answer:
      "I write about the work, and I'm an AWS Community Builder. The notes are on the blog.",
  },
]

export function FAQSection() {
  return (
    <section className="py-20 pb-32 bg-gray-50">
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">Questions people ask</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            AWS, releases, and the bill. If yours isn't here, send a note.
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
                className="bg-slate-900 hover:bg-slate-800 text-white transition-all duration-300 group"
              >
                <MessageCircle className="w-5 h-5 mr-2 group-hover:animate-bounce" />
                Have another question? Send a note.
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  )
} 