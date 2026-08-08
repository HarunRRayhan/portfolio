import {Head} from "@inertiajs/react"
import {AboutHero} from "@/Components/AboutHero"
import {JourneyTimeline} from "@/Components/JourneyTimeline"
import {SkillsShowcase} from "@/Components/SkillsShowcase"
import {PersonalValues} from "@/Components/PersonalValues"
import {FAQSection} from "@/Components/FAQSection"
import {VolunteeringSection} from "@/Components/VolunteeringSection"
import {getImageUrl} from "@/lib/imageUtils"

type Props = {
    canonicalUrl: string
}

export default function About({canonicalUrl}: Props) {
    return (
        <>
            <Head>
                <title>About Harun | Cloud Architect & DevOps Engineer</title>
                <meta name="description" content="Learn about Harun's journey, expertise in cloud architecture, DevOps engineering, and professional experience." />
                <meta name="keywords" content="cloud architect, DevOps engineer, professional background, cloud computing expert, AWS specialist, technical skills" />
                <meta property="og:title" content="About Harun | Cloud Architect & DevOps Engineer" />
                <meta property="og:description" content="Learn about Harun's journey, expertise in cloud architecture, DevOps engineering, and professional experience." />
                <meta property="og:type" content="profile" />
                <meta property="og:url" content={canonicalUrl} />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content="About Harun | Cloud Architect & DevOps Engineer" />
                <meta name="twitter:description" content="Learn about Harun's journey, expertise in cloud architecture, DevOps engineering, and professional experience." />
                <link rel="canonical" href={canonicalUrl} />
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
                            ],
                        },
                    })}
                </script>
            </Head>
            <AboutHero />
            <JourneyTimeline />
            <SkillsShowcase />
            <PersonalValues />
            <VolunteeringSection />
            <FAQSection />
        </>
    )
}
