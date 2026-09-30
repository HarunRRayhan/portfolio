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
            <AboutHero />
            <JourneyTimeline />
            <SkillsShowcase />
            <PersonalValues />
            <VolunteeringSection />
            <FAQSection />
        </>
    )
}
