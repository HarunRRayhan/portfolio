"use client"

import React from "react"
import {Link, usePage} from "@inertiajs/react"
import {Button} from "@/Components/ui/button"
import {ServiceHero} from "@/Components/ServiceHero"
import {Card, CardDescription, CardFooter, CardHeader, CardTitle} from "@/Components/ui/card/index"
import {
    ArrowRight,
    Cloud,
    Code,
    Database,
    Lock,
    Server,
    Zap,
    ArrowRightLeft,
    Brain,
    MonitorSmartphone,
    MessageSquare,
    Grid,
    Gauge,
    Replace,
} from "lucide-react"
import {Accordion, AccordionContent, AccordionItem, AccordionTrigger} from "@/Components/ui/accordion"

const serviceIcons = {
    "/services/vibe-scaling": Gauge,
    "/services/vibe-code-migration": Replace,
    "/services/cloud-architecture": Cloud,
    "/services/multi-cloud-architecture": Cloud,
    "/services/aws-cloud": Cloud,
    "/services/devops": Code,
    "/services/infrastructure-as-code": Server,
    "/services/serverless-infrastructure": Cloud,
    "/services/automated-deployment": Zap,
    "/services/security-consulting": Lock,
    "/services/performance-optimization": Zap,
    "/services/infrastructure-migration": ArrowRightLeft,
    "/services/mlops": Brain,
    "/services/database-migration": Database,
    "/services/database-optimization": Database,
    "/services/monitoring-observability": MonitorSmartphone,
}

type ServiceIndexCard = {
    title: string
    path: string
    description: string
    group: string
}

const serviceGroups = [
    {
        id: "shipped",
        title: "An AI-built app that has to survive production",
        lede: "You shipped it fast. It has users. Now it has to stay up.",
    },
    {
        id: "aws",
        title: "An AWS setup that's expensive or fragile",
        lede: "The account works, until the bill, the outage, or the next migration.",
    },
    {
        id: "release",
        title: "A release process you don't trust",
        lede: "Deploys depend on a person remembering the steps.",
    },
]

const faqs = [
    {
        question: "Which clouds do you work on?",
        answer:
            "Mostly AWS. I use Azure or Google Cloud when the project already lives there, or when one provider isn't the whole answer.",
    },
    {
        question: "What does the DevOps work actually change?",
        answer:
            "You get a release you can repeat. I set up CI, infrastructure as code, and the checks that stop a bad deploy from becoming an incident.",
    },
    {
        question: "Can you look at a slow database?",
        answer:
            "Slow queries, missing indexes, connection limits, and a migration plan when the database itself has to move. I work with MySQL, PostgreSQL, and the usual managed options on AWS.",
    },
    {
        question: "How do you look at cloud security?",
        answer:
            "IAM first, then network boundaries, encryption, and logs you can actually search. I look for the open path and the permission that's wider than the job.",
    },
    {
        question: "What is infrastructure as code?",
        answer:
            "The infrastructure lives in files you can review, like application code. I use Terraform and AWS CDK so a change is a pull request, not a click in the console.",
    },
    {
        question: "Can you make an app faster?",
        answer:
            "I measure the slow path first, then fix that. Caching, queries, and capacity you aren't using. The aim is a faster response and a smaller bill, in that order.",
    },
]

export default function ServicesPage() {
    const { serviceIndex = [] } = usePage().props as { serviceIndex?: ServiceIndexCard[] }

    return (
        <>
            <main className="flex flex-col min-h-screen">
                <ServiceHero
                    icon={Grid}
                    title="What I can help with"
                    description="Three kinds of work. Pick the one that sounds like your problem."
                    backgroundImage="/service-assets/services/hero.jpg"
                />

                <section className="py-24 bg-white">
                    <div className="container mx-auto px-4">
                        {serviceGroups.map((group) => (
                            <div key={group.id} className="mt-16 first:mt-0">
                                <h2 className="text-2xl font-semibold tracking-tight text-slate-950 md:text-3xl">{group.title}</h2>
                                <p className="mt-2 max-w-2xl text-slate-600">{group.lede}</p>
                                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                    {serviceIndex.filter((service) => service.group === group.id).map((service) => {
                                        const Icon = serviceIcons[service.path as keyof typeof serviceIcons] ?? Cloud

                                        return (
                                        <Card key={service.path} className="flex flex-col">
                                            <CardHeader>
                                                <div
                                                    className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center mb-4">
                                                    <Icon className="w-6 h-6 text-slate-700"/>
                                                </div>
                                                <CardTitle>{service.title}</CardTitle>
                                                <CardDescription>{service.description}</CardDescription>
                                            </CardHeader>
                                            <CardFooter className="mt-auto">
                                                <Link href={service.path}>
                                                    <Button variant="outline" className="w-full">
                                                        Read more
                                                        <ArrowRight className="w-4 h-4 ml-2"/>
                                                    </Button>
                                                </Link>
                                            </CardFooter>
                                        </Card>
                                        )
                                    })}
                                </div>
                            </div>
                        ))}
                        <div className="mt-16 text-center">
                            <Link href="/contact">
                                <Button
                                    variant="outline"
                                    size="lg"
                                    className="h-auto w-full max-w-xl whitespace-normal bg-white py-3 text-center text-slate-700 transition-all duration-300 hover:bg-slate-900 hover:text-white border-slate-300"
                                >
                                    <MessageSquare className="w-5 h-5 mr-2 shrink-0"/>
                                    Don't see it? Send me a note.
                                </Button>
                            </Link>
                        </div>
                    </div>
                </section>

                <section className="py-24 bg-gray-50">
                    <div className="container mx-auto px-4">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-12 text-center">Questions people ask</h2>
                        <Accordion type="single" collapsible className="max-w-3xl mx-auto">
                            {faqs.map((faq, index) => (
                                <AccordionItem key={index} value={`item-${index}`}>
                                    <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
                                    <AccordionContent>{faq.answer}</AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </div>
                </section>

            </main>
        </>
    )
}
