import { Head } from "@inertiajs/react"
import { Menubar } from "@/Components/Menubar"
import { Footer } from "@/Components/Footer"
import { ErrorBoundary } from "@/Components/ErrorBoundary"
import { AboutHero } from "@/Components/AboutHero"
import { JourneyTimeline } from "@/Components/JourneyTimeline"

export default function About() {
  return (
    <>
      <Head title="About - Harun" />
      
      <main className="relative min-h-screen">
        <ErrorBoundary>
          <Menubar />
        </ErrorBoundary>

        <ErrorBoundary>
          <AboutHero />
        </ErrorBoundary>

        <ErrorBoundary>
          <JourneyTimeline />
        </ErrorBoundary>

        <ErrorBoundary>
          <Footer />
        </ErrorBoundary>
      </main>
    </>
  )
} 