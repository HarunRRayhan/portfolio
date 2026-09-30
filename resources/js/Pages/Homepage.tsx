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

    return (
        <>
            <HeroSectionV2 />
            {/* Separate hydration work so React can yield to user input between sections. */}
            <Suspense fallback={null}><LogoSection /></Suspense>
            <Suspense fallback={null}><SkillsSection /></Suspense>
            <Suspense fallback={null}><TechStackSection /></Suspense>
            <Suspense fallback={null}><CaseStudiesHomeSection studies={featuredCaseStudies ?? []} /></Suspense>
            <Suspense fallback={null}><ReviewSlideSection /></Suspense>
        </>
    )
}
