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
