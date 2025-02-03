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
            <Head>
                <title>About Harun | Cloud Architect & DevOps Engineer</title>
                <meta name="description" content="Learn about Harun's journey, expertise in cloud architecture, DevOps engineering, and professional experience. Discover skills, values, and commitment to excellence in cloud computing." />
                <meta name="keywords" content="cloud architect, DevOps engineer, professional background, cloud computing expert, AWS specialist, technical skills" />
                
                {/* OpenGraph Tags */}
                <meta property="og:title" content="About Harun | Cloud Architect & DevOps Engineer" />
                <meta property="og:description" content="Learn about Harun's journey, expertise in cloud architecture, DevOps engineering, and professional experience. Discover skills, values, and commitment to excellence in cloud computing." />
                <meta property="og:type" content="profile" />
                <meta property="og:url" content={window.location.href} />
                
                {/* Twitter Card Tags */}
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content="About Harun | Cloud Architect & DevOps Engineer" />
                <meta name="twitter:description" content="Learn about Harun's journey, expertise in cloud architecture, DevOps engineering, and professional experience. Discover skills, values, and commitment to excellence in cloud computing." />
                
                {/* Canonical URL */}
                <link rel="canonical" href={window.location.href} />

                {/* JSON-LD Structured Data */}
                <script type="application/ld+json">
                    {JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "AboutPage",
                        "name": "About Harun - Cloud Architect & DevOps Engineer",
                        "mainEntity": {
                            "@type": "Person",
                            "name": "Harun",
                            "jobTitle": "Cloud Architect & DevOps Engineer",
                            "description": "Expert in cloud architecture, DevOps engineering, and infrastructure automation",
                            "knowsAbout": [
                                "Cloud Architecture",
                                "DevOps",
                                "AWS",
                                "Infrastructure as Code",
                                "CI/CD",
                                "Cloud Security",
                                "Performance Optimization"
                            ]
                        }
                    })}
                </script>
            </Head>

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
