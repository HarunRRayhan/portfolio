import { Head } from "@inertiajs/react"
import { HeroSectionV2 } from "@/Components/HeroSectionV2"
import { LogoSection } from "@/Components/LogoSection"
import { SkillsSection } from "@/Components/SkillsSection"
import { TechStackSection } from "@/Components/TechStackSection"
import { CaseStudiesHomeSection } from "@/Components/CaseStudiesSections"
import { ReviewSlideSection } from "@/Components/ReviewSlideSection"
import { usePage } from "@inertiajs/react"
import type { CaseStudyCardSummary } from "@/Components/CaseStudiesSections"

const canonicalUrl = 'https://harun.dev/'

export default function Homepage() {
    const { featuredCaseStudies } = usePage().props as {
        featuredCaseStudies?: CaseStudyCardSummary[]
    }

    return (
        <>
            <Head>
                <title>Harun R. Rayhan - Senior Software Engineer & DevOps Consultant</title>
                <meta name="description" content="Expert software engineer and DevOps consultant specializing in cloud architecture, AWS solutions, and infrastructure automation." />
                <meta name="keywords" content="software engineer, DevOps consultant, cloud architecture, AWS expert, infrastructure automation, CI/CD" />
                <meta property="og:title" content="Harun R. Rayhan - Senior Software Engineer & DevOps Consultant" />
                <meta property="og:description" content="Expert software engineer and DevOps consultant specializing in cloud architecture, AWS solutions, and infrastructure automation." />
                <meta property="og:type" content="website" />
                <meta property="og:url" content={canonicalUrl} />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content="Harun R. Rayhan - Senior Software Engineer & DevOps Consultant" />
                <meta name="twitter:description" content="Expert software engineer and DevOps consultant specializing in cloud architecture, AWS solutions, and infrastructure automation." />
                <link rel="canonical" href={canonicalUrl} />
                <script type="application/ld+json">
                    {JSON.stringify({
                        '@context': 'https://schema.org',
                        '@type': 'Person',
                        name: 'Harun R. Rayhan',
                        jobTitle: 'Senior Software Engineer & DevOps Consultant',
                        description: 'Expert software engineer and DevOps consultant specializing in cloud architecture and AWS solutions',
                        url: canonicalUrl,
                        knowsAbout: [
                            'Software Engineering',
                            'DevOps',
                            'Cloud Architecture',
                            'AWS',
                            'Infrastructure Automation',
                            'CI/CD',
                            'Cloud Security',
                        ],
                        offers: {
                            '@type': 'Offer',
                            name: 'DevOps and Cloud Consulting Services',
                            description: 'Professional consulting services in cloud architecture, DevOps implementation, and infrastructure automation',
                        },
                    })}
                </script>
            </Head>
            <HeroSectionV2 />
            <LogoSection />
            <SkillsSection />
            <TechStackSection />
            <CaseStudiesHomeSection studies={featuredCaseStudies ?? []} />
            <ReviewSlideSection />
        </>
    )
}
