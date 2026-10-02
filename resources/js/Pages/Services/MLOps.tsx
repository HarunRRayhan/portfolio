'use client'

import { ServiceHero } from "@/Components/ServiceHero"
import { Button } from "@/Components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card"
import { Brain, GitBranch, BarChart, ArrowRight, CheckCircle, Users, Database, Cloud, Zap } from 'lucide-react'
import { Link } from '@inertiajs/react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/Components/ui/accordion"
import { motion } from "framer-motion"
import { useEffect, useRef, useState } from "react"
import { InfiniteScrollTech } from "@/Components/InfiniteScrollTech"
import { getImageUrl } from "@/lib/imageUtils"

const technologies = [
  {
    name: "TensorFlow",
    logo: getImageUrl("/images/logos/tech/tf_logo_social.png"),
  },
  {
    name: "PyTorch",
    logo: getImageUrl("/images/logos/tech/pytorch-logo.svg"),
  },
  {
    name: "Kubernetes",
    logo: getImageUrl("/images/logos/tech/favicon.png"),
  },
  {
    name: "Kubeflow",
    logo: getImageUrl("/images/logos/tech/logo.svg"),
  },
  {
    name: "MLflow",
    logo: getImageUrl("/images/logos/tech/mlflow-logo.svg"),
  },
  {
    name: "Apache Airflow",
    logo: getImageUrl("/images/logos/tech/apache-airflow-logo.svg"),
  },
  {
    name: "Docker",
    logo: getImageUrl("/images/logos/tech/docker-logo.svg"),
  },
  {
    name: "Nvidia CUDA",
    logo: getImageUrl("/images/logos/tech/cuda_logo_white.jpg"),
  },
  {
    name: "Amazon SageMaker",
    logo: getImageUrl("/images/logos/tech/aws-sagemaker-logo.svg"),
  },
  {
    name: "Google Cloud AI Platform",
    logo: getImageUrl("/images/logos/tech/cloud-logo.svg"),
  },
  {
    name: "Azure Machine Learning",
    logo: getImageUrl("/images/logos/cloud/machine-learning.png"),
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

export default function MLOps({ canonicalUrl }: { canonicalUrl?: string }) {
  return (
    <>
      <main className="flex flex-col min-h-screen">
        <ServiceHero
          icon={Brain}
          title="MLOps"
          description="The infrastructure around training and serving models, from the notebook to production."
          backgroundImage="/service-assets/mlops/hero.jpg"
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
                  title: "Train it, store it, serve it",
                  content:
                    "Training jobs, a place to put the model, and a way to serve it.",
                },
                {
                  icon: GitBranch,
                  title: "A model change goes through a pipeline",
                  content:
                    "A model change should go through a pipeline, the same way an app change does.",
                },
                {
                  icon: BarChart,
                  title: "Did the answers change",
                  content:
                    "I watch whether the model still answers well, and whether the data going in has changed.",
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
                  title: "The infrastructure around the model",
                  content:
                    "I work on the infrastructure around the model: training jobs, deploys, and the checks that tell you it drifted.",
                },
                {
                  title: "From the notebook to production",
                  content:
                    "The notebook can stay. The production path cannot be 'run it on my laptop'.",
                },
                {
                  title: "You can rebuild it",
                  content:
                    "I version the data, the code, and the model, so last month's result can be rebuilt.",
                },
                {
                  title: "Where it already runs",
                  content:
                    "I use the cloud the training job already runs on. I don't move it for the sake of a diagram.",
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
                  icon: Brain,
                  title: "From a notebook to a user",
                  content:
                    "I look at how a model gets from a notebook to something a user can hit.",
                },
                {
                  icon: Cloud,
                  title: "Training, registry, serving",
                  content: "You get the training job, the registry, and how a new model gets served.",
                },
                {
                  icon: GitBranch,
                  title: "In the repo you already have",
                  content: "I wire it into the repo and the cloud account you already have.",
                },
                {
                  icon: Users,
                  title: "One training run, one deploy",
                  content:
                    "I walk through one training run and one deploy, and leave the notes beside them.",
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
              If the model works in a notebook and stalls in production, start there.
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
                    question: "What is MLOps?",
                    answer:
                      "The path from a notebook to a model that users hit, with a way to train it again and see if it drifted.",
                  },
                  {
                    question: "How is this different from a normal deploy pipeline?",
                    answer:
                      "DevOps versions code. This also has to version the data and the model, and watch whether the answers got worse.",
                  },
                  {
                    question: "What does the pipeline include?",
                    answer:
                      "Data in, a training job, a registry, a way to serve the model, and an alarm when it drifts.",
                  },
                  {
                    question: "How do you version a model?",
                    answer:
                      "I version the data, the code, and the model, usually with MLflow or DVC, so last month's result can be rebuilt.",
                  },
                  {
                    question: "How do you lock down the model and the data?",
                    answer:
                      "The training data and the endpoint get real access control, and the data is encrypted. I follow the policy your security people already have.",
                  },
                  {
                    question: "Can you take a notebook and make it a deploy?",
                    answer:
                      "I look at how a model leaves the notebook today, then add the pipeline and the registry. Your team sees one training run and one deploy.",
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