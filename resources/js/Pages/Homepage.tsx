import { Suspense } from "react"
import { HeroSectionV2 } from "@/Components/HeroSectionV2"
import { LogoSection } from "@/Components/LogoSection"
import { SkillsSection } from "@/Components/SkillsSection"
import { TechStackSection } from "@/Components/TechStackSection"
import { CaseStudiesHomeSection } from "@/Components/CaseStudiesSections"
import { ReviewSlideSection } from "@/Components/ReviewSlideSection"
import { usePage } from "@inertiajs/react"
import type { CaseStudyCardSummary } from "@/Components/CaseStudiesSections"

export default function Homepage() {
    const { featuredCaseStudies, canonicalUrl = '/' } = usePage().props as {
        featuredCaseStudies?: CaseStudyCardSummary[]
        canonicalUrl?: string
    }
    const studies = featuredCaseStudies ?? []
    const lead = studies[0] ?? null
    const moreStudies = studies.slice(1)

    return (
        <>
            <HeroSectionV2 study={lead} />
            {/* Separate hydration work so React can yield to user input between sections. */}
            {studies.length === 0 ? (
                <Suspense fallback={null}><CaseStudiesHomeSection studies={[]} /></Suspense>
            ) : moreStudies.length > 0 ? (
                <Suspense fallback={null}><CaseStudiesHomeSection studies={moreStudies} /></Suspense>
            ) : null}
            <Suspense fallback={null}><LogoSection /></Suspense>
            <Suspense fallback={null}><SkillsSection /></Suspense>
            <Suspense fallback={null}><TechStackSection /></Suspense>
            <Suspense fallback={null}><ReviewSlideSection /></Suspense>
        </>
    )
}
