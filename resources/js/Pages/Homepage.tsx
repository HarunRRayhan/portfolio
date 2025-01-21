'use client'

import React from "react"
import { Head } from "@inertiajs/react"
import { Menubar } from "@/Components/Menubar"
import { HeroSectionV2 } from "@/Components/HeroSectionV2"
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
            </main>
        </ErrorBoundary>
    )
}
