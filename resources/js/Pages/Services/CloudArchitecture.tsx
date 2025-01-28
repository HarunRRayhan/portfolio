"use client"

import React from "react"
import { Head } from "@inertiajs/react"
import { Menubar } from "@/Components/Menubar"
import { Footer } from "@/Components/Footer"
import { ServiceHero } from "@/Components/ServiceHero"
import { Button } from "@/Components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card/index"
import { Cloud, Server, Lock, ArrowRight } from "lucide-react"
import { Link } from "@inertiajs/react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/Components/ui/accordion"

export default function CloudArchitecturePage() {
  return (
    <>
      <Head title="Cloud Architecture" />
      <main className="flex flex-col min-h-screen">
        <Menubar />
        <ServiceHero
          icon={Cloud}
          title="Cloud Architecture"
          description="Design and implement scalable, secure, and cost-effective cloud solutions tailored to your business needs."
        />
        <section className="py-24 bg-white">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card>
                <CardHeader>
                  <Cloud className="w-10 h-10 text-[#7C3AED] mb-4" />
                  <CardTitle>Scalable Infrastructure</CardTitle>
                </CardHeader>
                <CardContent>
                  Design cloud architectures that can seamlessly scale to meet your growing business demands.
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <Server className="w-10 h-10 text-[#7C3AED] mb-4" />
                  <CardTitle>Cost Optimization</CardTitle>
                </CardHeader>
                <CardContent>
                  Implement strategies to optimize cloud costs while maintaining high performance and reliability.
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <Lock className="w-10 h-10 text-[#7C3AED] mb-4" />
                  <CardTitle>Security-First Design</CardTitle>
                </CardHeader>
                <CardContent>
                  Ensure your cloud architecture adheres to best security practices and compliance requirements.
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
        <section className="py-24 bg-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-8">Ready to build & optimize your cloud architecture?</h2>
            <Link href="/contact">
              <Button size="lg" className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white">
                Get Started
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </section>
        <section className="py-24 bg-gray-50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
            <Accordion type="single" collapsible className="max-w-3xl mx-auto">
              <AccordionItem value="item-1">
                <AccordionTrigger>What cloud platforms do you work with?</AccordionTrigger>
                <AccordionContent>
                  We primarily work with AWS (Amazon Web Services), but we also have expertise in Microsoft Azure and
                  Google Cloud Platform. Our team can help you choose the best cloud platform for your specific needs and
                  requirements.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger>How do you ensure scalability in cloud architecture?</AccordionTrigger>
                <AccordionContent>
                  We design cloud architectures with scalability in mind from the ground up. This includes using
                  auto-scaling groups, load balancers, and serverless technologies where appropriate. We also implement
                  best practices for database scaling and caching to ensure your application can handle increased loads
                  seamlessly.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3">
                <AccordionTrigger>Can you help with cloud migration?</AccordionTrigger>
                <AccordionContent>
                  Yes, we offer comprehensive cloud migration services. We'll assess your current infrastructure, develop
                  a migration strategy, and execute the migration with minimal downtime. Our approach ensures data
                  integrity and maintains business continuity throughout the process.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-4">
                <AccordionTrigger>How do you address security concerns in cloud architecture?</AccordionTrigger>
                <AccordionContent>
                  Security is a top priority in our cloud architecture designs. We implement best practices such as
                  encryption at rest and in transit, identity and access management (IAM), network segmentation, and
                  regular security audits. We also ensure compliance with relevant industry standards and regulations.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-5">
                <AccordionTrigger>What's your approach to cost optimization in cloud architecture?</AccordionTrigger>
                <AccordionContent>
                  We take a proactive approach to cost optimization. This includes right-sizing resources, leveraging
                  reserved instances or savings plans, implementing auto-scaling to match demand, and using cost
                  allocation tags. We also provide ongoing monitoring and recommendations to ensure your cloud spend
                  remains optimized as your needs evolve.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </section>
        <Footer />
      </main>
    </>
  )
}
