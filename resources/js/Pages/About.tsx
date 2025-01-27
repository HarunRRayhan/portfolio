import {Head} from "@inertiajs/react"
import {Menubar} from "@/Components/Menubar"
import {Footer} from "@/Components/Footer"
import {ErrorBoundary} from "@/Components/ErrorBoundary"
import {AboutHero} from "@/Components/AboutHero"
import {JourneyTimeline} from "@/Components/JourneyTimeline"
import {SkillsShowcase} from "@/Components/SkillsShowcase"
import {PersonalValues} from "@/Components/PersonalValues"
import {FAQSection} from "@/Components/FAQSection"
import { VolunteeringSection } from "@/Components/VolunteeringSection"

export default function About() {
    return (
        <>
            <Head title="About - Harun"/>

            <main className="relative min-h-screen">
                <ErrorBoundary>
                    <Menubar/>
                </ErrorBoundary>

                <ErrorBoundary>
                    <AboutHero/>
                </ErrorBoundary>

                <ErrorBoundary>
                    <SkillsShowcase/>
                </ErrorBoundary>

                <ErrorBoundary>
                    <PersonalValues/>
                </ErrorBoundary>

                <ErrorBoundary>
                    <VolunteeringSection />
                </ErrorBoundary>

                <ErrorBoundary>
                    <JourneyTimeline/>
                </ErrorBoundary>

                <ErrorBoundary>
                    <FAQSection/>
                </ErrorBoundary>

                <ErrorBoundary>
                    <Footer/>
                </ErrorBoundary>
            </main>
        </>
    )
}
