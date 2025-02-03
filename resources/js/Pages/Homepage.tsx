'use client'

import React from "react"
import { Head } from "@inertiajs/react"
import { Menubar } from "@/Components/Menubar"
import { HeroSectionV2 } from "@/Components/HeroSectionV2"
import { LogoSection } from "@/Components/LogoSection"
import { SkillsSection } from "@/Components/SkillsSection"
import { TechStackSection } from "@/Components/TechStackSection"
import { ReviewSlideSection } from "@/Components/ReviewSlideSection"
import { Footer } from "@/Components/Footer"
import { ErrorBoundary } from "@/Components/ErrorBoundary"

export default function Homepage() {
    return (
        <ErrorBoundary>
            <Head>
                <title>Harun R. Rayhan - Senior Software Engineer & DevOps Consultant</title>
                <meta name="description" content="Expert software engineer and DevOps consultant specializing in cloud architecture, AWS solutions, and infrastructure automation. Discover how I can help transform your business." />
                <meta name="keywords" content="software engineer, DevOps consultant, cloud architecture, AWS expert, infrastructure automation, CI/CD" />
                
                {/* OpenGraph Tags */}
                <meta property="og:title" content="Harun R. Rayhan - Senior Software Engineer & DevOps Consultant" />
                <meta property="og:description" content="Expert software engineer and DevOps consultant specializing in cloud architecture, AWS solutions, and infrastructure automation. Discover how I can help transform your business." />
                <meta property="og:type" content="website" />
                <meta property="og:url" content={window.location.href} />
                
                {/* Twitter Card Tags */}
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content="Harun R. Rayhan - Senior Software Engineer & DevOps Consultant" />
                <meta name="twitter:description" content="Expert software engineer and DevOps consultant specializing in cloud architecture, AWS solutions, and infrastructure automation. Discover how I can help transform your business." />
                
                {/* Canonical URL */}
                <link rel="canonical" href={window.location.href} />

                {/* JSON-LD Structured Data */}
                <script type="application/ld+json">
                    {JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "Person",
                        "name": "Harun R. Rayhan",
                        "jobTitle": "Senior Software Engineer & DevOps Consultant",
                        "description": "Expert software engineer and DevOps consultant specializing in cloud architecture and AWS solutions",
                        "url": window.location.href,
                        "knowsAbout": [
                            "Software Engineering",
                            "DevOps",
                            "Cloud Architecture",
                            "AWS",
                            "Infrastructure Automation",
                            "CI/CD",
                            "Cloud Security"
                        ],
                        "offers": {
                            "@type": "Offer",
                            "name": "DevOps and Cloud Consulting Services",
                            "description": "Professional consulting services in cloud architecture, DevOps implementation, and infrastructure automation"
                        }
                    })}
                </script>
            </Head>
            <main className="min-h-screen font-sans">
                <ErrorBoundary>
                    <Menubar/>
                </ErrorBoundary>
                <ErrorBoundary>
                    <HeroSectionV2/>
                </ErrorBoundary>
                <ErrorBoundary>
                    <LogoSection/>
                </ErrorBoundary>
                <ErrorBoundary>
                    <SkillsSection/>
                </ErrorBoundary>
                <ErrorBoundary>
                    <TechStackSection/>
                </ErrorBoundary>
                <ErrorBoundary>
                    <ReviewSlideSection/>
                </ErrorBoundary>
                <ErrorBoundary>
                    <Footer/>
                </ErrorBoundary>
            </main>
        </ErrorBoundary>
    )
}
