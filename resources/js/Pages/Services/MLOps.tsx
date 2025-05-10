'use client'

import { Menubar } from "@/Components/Menubar"
import { Footer } from "@/Components/Footer"
import { ServiceHero } from "@/Components/ServiceHero"
import { Button } from "@/Components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card"
import { Brain, GitBranch, BarChart, ArrowRight, CheckCircle, Users, Database, Cloud, Zap } from 'lucide-react'
import { Link, Head } from '@inertiajs/react'
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
    logo: getImageUrl("/images/logos/tech/pytorch-logo.png"),
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
    logo: getImageUrl("/images/logos/tech/MLflow-logo-final-black.png"),
  },
  {
    name: "Apache Airflow",
    logo: getImageUrl("/images/logos/tech/pin_large.png"),
  },
  {
    name: "Docker",
    logo: getImageUrl("/images/logos/tech/vertical-logo-monochromatic.png"),
  },
  {
    name: "Nvidia CUDA",
    logo: getImageUrl("/images/logos/tech/cuda_logo_white.jpg"),
  },
  {
    name: "Amazon SageMaker",
    logo: getImageUrl("/images/logos/tech/SageMaker_Amazon.6e2760a8a5f7e5f3a8b7e9f9b6d2f7e7e5f3a8b7e9f9b6d2f7e7.png"),
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

export default function MLOps() {
  return (
    <>
      <Head>
        <title>MLOps & Machine Learning Operations Services | Harun R. Rayhan</title>
        <meta name="description" content="Expert MLOps services. Streamline your machine learning operations with automated pipelines, model deployment, and monitoring solutions." />
        <meta name="keywords" content="MLOps, machine learning operations, ML pipeline automation, model deployment, model monitoring, AI operations, ML infrastructure" />
        
        {/* OpenGraph Tags */}
        <meta property="og:title" content="MLOps & Machine Learning Operations Services | Harun R. Rayhan" />
        <meta property="og:description" content="Expert MLOps services. Streamline your machine learning operations with automated pipelines, model deployment, and monitoring solutions." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={window.location.href} />
        
        {/* Twitter Card Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="MLOps & Machine Learning Operations Services | Harun R. Rayhan" />
        <meta name="twitter:description" content="Expert MLOps services. Streamline your machine learning operations with automated pipelines, model deployment, and monitoring solutions." />
        
        {/* Canonical URL */}
        <link rel="canonical" href={window.location.href} />

        {/* JSON-LD Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Service",
            "name": "MLOps Services",
            "provider": {
              "@type": "Person",
              "name": "Harun R. Rayhan",
              "description": "MLOps & Machine Learning Expert"
            },
            "serviceType": "Machine Learning Operations",
            "description": "Expert MLOps and machine learning operations services",
            "offers": {
              "@type": "Offer",
              "description": "ML Pipeline Automation, Model Deployment, Model Monitoring"
            },
            "hasOfferCatalog": {
              "@type": "OfferCatalog",
              "name": "MLOps Services",
              "itemListElement": [
                {
                  "@type": "Offer",
                  "itemOffered": {
                    "@type": "Service",
                    "name": "ML Pipeline Automation",
                    "description": "Automated machine learning pipelines for efficient model training and deployment"
                  }
                },
                {
                  "@type": "Offer",
                  "itemOffered": {
                    "@type": "Service",
                    "name": "Model Deployment",
                    "description": "Streamlined deployment of machine learning models to production"
                  }
                },
                {
                  "@type": "Offer",
                  "itemOffered": {
                    "@type": "Service",
                    "name": "Model Monitoring",
                    "description": "Comprehensive monitoring and maintenance of ML models in production"
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
          icon={Brain}
          title="MLOps"
          description="Streamline your machine learning operations with automated workflows and efficient infrastructure."
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
              Our MLOps Services
            </motion.h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: Cloud,
                  title: "ML Infrastructure Design",
                  content:
                    "Design scalable and efficient infrastructure to support your AI/ML workflows and model deployments.",
                },
                {
                  icon: GitBranch,
                  title: "CI/CD for ML",
                  content:
                    "Implement continuous integration and deployment pipelines specifically tailored for machine learning models.",
                },
                {
                  icon: BarChart,
                  title: "Model Monitoring",
                  content:
                    "Set up comprehensive monitoring systems to track model performance, data drift, and system health.",
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
              Why Choose Us for MLOps
            </motion.h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[
                {
                  title: "End-to-End Expertise",
                  content:
                    "Our team has deep expertise in both machine learning and DevOps, ensuring seamless integration of ML workflows.",
                },
                {
                  title: "Scalable Solutions",
                  content:
                    "We design MLOps solutions that can scale with your AI/ML initiatives, from proof-of-concept to enterprise-wide deployments.",
                },
                {
                  title: "Best Practices Implementation",
                  content:
                    "We implement industry best practices for reproducibility, versioning, and governance in ML workflows.",
                },
                {
                  title: "Cloud-Agnostic Approach",
                  content:
                    "Our MLOps solutions work across major cloud providers and on-premises infrastructure, giving you flexibility and avoiding vendor lock-in.",
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
              Our MLOps Implementation Process
            </motion.h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {[
                {
                  icon: Brain,
                  title: "1. Assessment",
                  content:
                    "We evaluate your current ML workflows and infrastructure to identify areas for improvement and automation.",
                },
                {
                  icon: Cloud,
                  title: "2. Design",
                  content: "We design a comprehensive MLOps architecture tailored to your specific needs and scale.",
                },
                {
                  icon: GitBranch,
                  title: "3. Implementation",
                  content: "We implement the MLOps solution, integrating with your existing tools and processes.",
                },
                {
                  icon: Users,
                  title: "4. Training & Support",
                  content:
                    "We provide thorough training and ongoing support to ensure successful adoption of MLOps practices.",
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
              Ready to optimize your AI/ML infrastructure?
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
                    question: "What is MLOps and why is it important?",
                    answer:
                      "MLOps, or Machine Learning Operations, is a set of practices that combines Machine Learning, DevOps, and Data Engineering to deploy and maintain ML models in production reliably and efficiently. It's important because it addresses the unique challenges of ML systems, such as reproducibility, versioning, and the need for continuous monitoring and retraining. MLOps helps organizations move from experimental ML projects to production-ready AI systems that deliver consistent business value.",
                  },
                  {
                    question: "How does MLOps differ from traditional DevOps?",
                    answer:
                      "While MLOps builds on DevOps principles, it addresses the specific needs of ML systems. Key differences include: 1) Data versioning and management, as ML models depend heavily on data, 2) Model versioning, which goes beyond code versioning, 3) Experiment tracking and reproducibility, 4) Model-specific testing and validation, 5) Continuous monitoring for model performance and data drift, and 6) Automated retraining and deployment of models. These additional complexities make MLOps a specialized field that requires expertise in both ML and operations.",
                  },
                  {
                    question: "What are the key components of an MLOps pipeline?",
                    answer:
                      "A comprehensive MLOps pipeline typically includes the following key components: 1) Data ingestion and preparation, 2) Feature engineering and storage, 3) Model training and hyperparameter tuning, 4) Model evaluation and validation, 5) Model versioning and registry, 6) Model deployment and serving, 7) Monitoring and logging, 8) Automated retraining and deployment. Each of these components requires careful design and implementation to ensure a smooth, efficient, and reliable ML workflow.",
                  },
                  {
                    question: "How do you handle model versioning in MLOps?",
                    answer:
                      "Model versioning is crucial in MLOps to ensure reproducibility and traceability. We use specialized tools like MLflow or DVC (Data Version Control) to version not just the model code, but also the data, hyperparameters, and entire training environment. This allows us to recreate any model version exactly as it was. We also implement a model registry that serves as a centralized repository for managing model versions, including metadata about each version's performance, training data, and deployment status.",
                  },
                  {
                    question: "How do you ensure the security of ML models and data in an MLOps setup?",
                    answer:
                      "Security is a critical aspect of our MLOps implementations. We employ several strategies: 1) Data encryption both at rest and in transit, 2) Strict access controls and authentication for all components of the ML pipeline, 3) Secure model serving with API authentication and rate limiting, 4) Regular security audits and vulnerability assessments, 5) Compliance with data protection regulations like GDPR or CCPA, 6) Secure feature stores with proper data governance, and 7) Monitoring for unusual access patterns or potential data leaks. We also work closely with your security team to ensure our MLOps setup aligns with your organization's security policies.",
                  },
                  {
                    question: "Can you help with the transition from traditional data science workflows to MLOps?",
                    answer:
                      "We specialize in helping organizations make this transition. Our approach includes: 1) Assessing your current workflows and identifying areas for improvement, 2) Introducing MLOps tools and practices gradually to minimize disruption, 3) Setting up automated CI/CD pipelines for ML workflows, 4) Implementing proper versioning for data, code, and models, 5) Establishing monitoring and logging practices for production models, 6) Training your team on MLOps best practices and tools. We understand that this transition can be challenging, so we work closely with your team to ensure a smooth adoption of MLOps practices.",
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