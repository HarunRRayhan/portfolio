"use client"

import React from "react"
import {Head, Link} from "@inertiajs/react"
import {motion} from "framer-motion"
import {Menubar} from "@/Components/Menubar"
import {Footer} from "@/Components/Footer"
import {Button} from "@/Components/ui/button"
import {getImageUrl} from "@/lib/imageUtils"
import {Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle} from "@/Components/ui/card/index"
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
    Network,
    MonitorSmartphone,
    MessageSquare,
    Grid,
} from "lucide-react"
import {Accordion, AccordionContent, AccordionItem, AccordionTrigger} from "@/Components/ui/accordion"

const services = [
    {
        icon: Cloud,
        title: "Multi-Cloud Architecture",
        description:
            "Design and implement robust multi-cloud solutions that leverage the best of AWS, Azure, and Google Cloud Platform.",
        link: "/services/multi-cloud-architecture",
    },
    {
        icon: Cloud,
        title: "AWS Cloud",
        description: "Leverage the full power of Amazon Web Services with our expert AWS cloud solutions and management.",
        link: "/services/aws-cloud",
    },
    {
        icon: Code,
        title: "DevOps Implementation",
        description: "Streamline your development and operations with cutting-edge DevOps practices and tools.",
        link: "/services/devops",
    },
    {
        icon: Server,
        title: "Infrastructure as Code",
        description: "Implement and manage your infrastructure using modern IaC tools like Terraform and AWS CDK.",
        link: "/services/infrastructure-as-code",
    },
    {
        icon: Cloud,
        title: "Serverless Infrastructure",
        description: "Design and implement scalable serverless solutions to reduce operational overhead and costs.",
        link: "/services/serverless-infrastructure",
    },
    {
        icon: Zap,
        title: "Automated Deployment (CI/CD)",
        description:
            "Implement efficient CI/CD pipelines for faster, more reliable software delivery and deployment processes.",
        link: "/services/automated-deployment",
    },
    {
        icon: Lock,
        title: "Security Consulting",
        description: "Enhance your cloud and application security with expert consulting and implementation services.",
        link: "/services/security-consulting",
    },
    {
        icon: Zap,
        title: "Performance Optimization",
        description:
            "Boost your application and infrastructure performance with expert analysis and optimization techniques.",
        link: "/services/performance-optimization",
    },
    {
        icon: ArrowRightLeft,
        title: "Infrastructure Migration",
        description: "Seamlessly migrate your infrastructure to modern, scalable platforms with minimal downtime.",
        link: "/services/infrastructure-migration",
    },
    {
        icon: Brain,
        title: "MLOps (AI/ML Infrastructure)",
        description: "Build and manage robust infrastructure for AI/ML workflows, from development to production.",
        link: "/services/mlops",
    },
    {
        icon: Database,
        title: "Database Migration",
        description: "Migrate your databases to modern platforms while ensuring data integrity and minimal disruption.",
        link: "/services/database-migration",
    },
    // {
    //     icon: Network,
    //     title: "Network Optimization",
    //     description: "Enhance your network infrastructure for improved performance, security, and reliability.",
    //     link: "/services/network-optimization",
    // },
    {
        icon: MonitorSmartphone,
        title: "Monitoring and Observability",
        description: "Implement comprehensive monitoring and observability solutions for your entire stack.",
        link: "/services/monitoring-observability",
    },
    // {
    //     icon: Database,
    //     title: "Database Optimization",
    //     description:
    //         "Optimize your database performance, security, and scalability for improved application responsiveness.",
    //     link: "/services/database-optimization",
    // },
]

const faqs = [
    {
        question: "What cloud platforms do you specialize in?",
        answer:
            "We specialize in AWS (Amazon Web Services), but also have expertise in other major cloud platforms such as Microsoft Azure and Google Cloud Platform. Our team is certified in multiple AWS domains, ensuring we can provide comprehensive solutions across the entire AWS ecosystem.",
    },
    {
        question: "How can DevOps practices benefit my business?",
        answer:
            "DevOps practices can significantly benefit your business by improving collaboration between development and operations teams, accelerating software delivery, increasing reliability, and reducing time-to-market. Our DevOps implementation services focus on automating processes, implementing continuous integration and delivery (CI/CD), and fostering a culture of shared responsibility and continuous improvement.",
    },
    {
        question: "What types of database optimization services do you offer?",
        answer:
            "Our database optimization services cover a wide range of areas including query performance tuning, indexing strategies, data modeling, replication setup, and scalability planning. We work with various database systems including SQL databases like MySQL and PostgreSQL, as well as NoSQL databases like MongoDB and DynamoDB.",
    },
    {
        question: "How do you approach cloud security in your projects?",
        answer:
            "Security is a foundational aspect of all our cloud projects. We implement a defense-in-depth strategy that includes identity and access management, network security, encryption, monitoring, and compliance. We follow security best practices from major cloud providers and industry standards like CIS and NIST. Our approach includes regular security assessments, automated security testing in CI/CD pipelines, and comprehensive logging and monitoring to detect and respond to potential security incidents.",
    },
    {
        question: "What is Infrastructure as Code (IaC) and why is it important?",
        answer:
            "Infrastructure as Code (IaC) is the practice of managing and provisioning computing infrastructure through machine-readable definition files, rather than physical hardware configuration or interactive configuration tools. It's important because it allows for consistent, version-controlled, and repeatable infrastructure deployments, reducing human error and increasing efficiency. We specialize in tools like Terraform and AWS CloudFormation to implement IaC solutions.",
    },
    {
        question: "How can your performance optimization services improve my application?",
        answer:
            "Our performance optimization services can improve your application in several ways. We conduct thorough performance audits to identify bottlenecks, optimize database queries and application code, implement caching strategies, and fine-tune server configurations. We also leverage cloud services for auto-scaling and load balancing to ensure your application performs well under varying loads. The result is faster response times, improved user experience, and more efficient resource utilization.",
    },
]

export default function ServicesPage() {
    return (
        <>
            <Head>
                <title>Professional Cloud & DevOps Services | Harun's Portfolio</title>
                <meta name="description" content="Expert cloud computing, DevOps, and software engineering services including AWS, Infrastructure as Code, CI/CD, security consulting, and performance optimization." />
                <meta name="keywords" content="cloud services, AWS, DevOps, Infrastructure as Code, CI/CD, security consulting, performance optimization" />
                
                {/* OpenGraph Tags */}
                <meta property="og:title" content="Professional Cloud & DevOps Services | Harun's Portfolio" />
                <meta property="og:description" content="Expert cloud computing, DevOps, and software engineering services including AWS, Infrastructure as Code, CI/CD, security consulting, and performance optimization." />
                <meta property="og:type" content="website" />
                <meta property="og:url" content={window.location.href} />
                
                {/* Twitter Card Tags */}
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content="Professional Cloud & DevOps Services | Harun's Portfolio" />
                <meta name="twitter:description" content="Expert cloud computing, DevOps, and software engineering services including AWS, Infrastructure as Code, CI/CD, security consulting, and performance optimization." />
                
                {/* Canonical URL */}
                <link rel="canonical" href={window.location.href} />

                {/* JSON-LD Structured Data */}
                <script type="application/ld+json">
                    {JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "ProfessionalService",
                        "name": "Harun's Cloud & DevOps Services",
                        "description": "Expert cloud computing, DevOps, and software engineering services including AWS, Infrastructure as Code, CI/CD, security consulting, and performance optimization.",
                        "offers": services.map(service => ({
                            "@type": "Offer",
                            "name": service.title,
                            "description": service.description
                        })),
                        "hasOfferCatalog": {
                            "@type": "OfferCatalog",
                            "name": "Cloud & DevOps Services",
                            "itemListElement": services.map((service, index) => ({
                                "@type": "OfferCatalog",
                                "position": index + 1,
                                "name": service.title,
                                "description": service.description
                            }))
                        }
                    })}
                </script>
            </Head>
            <main className="flex flex-col min-h-screen">
                <Menubar/>
                <section className="py-24 bg-gradient-to-br from-[#86D2F1] via-[#7C3AED] to-[#8B5CF6]">
                    <div className="container mx-auto px-4 text-center">
                        <motion.div
                            initial={{opacity: 0, y: -20}}
                            animate={{opacity: 1, y: 0}}
                            transition={{duration: 0.5}}
                            className="w-16 h-16 rounded-lg bg-white/10 flex items-center justify-center mx-auto mb-6"
                        >
                            <Grid className="w-8 h-8 text-white"/>
                        </motion.div>
                        <motion.h1
                            initial={{opacity: 0, y: -20}}
                            animate={{opacity: 1, y: 0}}
                            transition={{duration: 0.5, delay: 0.1}}
                            className="text-4xl md:text-5xl font-bold text-white mb-6"
                        >
                            Our Services
                        </motion.h1>
                        <motion.p
                            initial={{opacity: 0, y: -20}}
                            animate={{opacity: 1, y: 0}}
                            transition={{duration: 0.5, delay: 0.2}}
                            className="text-xl text-white/90 max-w-3xl mx-auto"
                        >
                            Elevate your business with our comprehensive range of software engineering and cloud
                            services.
                        </motion.p>
                    </div>
                </section>

                <section className="py-24 bg-white">
                    <div className="container mx-auto px-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {services.map((service, index) => (
                                <Card key={index} className="flex flex-col">
                                    <CardHeader>
                                        <div
                                            className="w-12 h-12 rounded-lg bg-[#7C3AED] bg-opacity-10 flex items-center justify-center mb-4">
                                            <service.icon className="w-6 h-6 text-[#7C3AED]"/>
                                        </div>
                                        <CardTitle>{service.title}</CardTitle>
                                        <CardDescription>{service.description}</CardDescription>
                                    </CardHeader>
                                    <CardFooter className="mt-auto">
                                        <Link href={service.link}>
                                            <Button variant="outline" className="w-full">
                                                Learn More
                                                <ArrowRight className="w-4 h-4 ml-2"/>
                                            </Button>
                                        </Link>
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>
                        <div className="mt-16 text-center">
                            <Link href="/contact">
                                <Button
                                    variant="outline"
                                    size="lg"
                                    className="bg-white text-[#7C3AED] hover:bg-[#7C3AED] hover:text-white border-[#7C3AED] transition-all duration-300"
                                >
                                    <MessageSquare className="w-5 h-5 mr-2"/>
                                    Is the service you're looking for missing? We might do it. Send us a message.
                                </Button>
                            </Link>
                        </div>
                    </div>
                </section>

                <section className="py-24 bg-gray-50">
                    <div className="container mx-auto px-4">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-12 text-center">Frequently Asked
                            Questions</h2>
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

                <Footer/>
            </main>
        </>
    )
}
