'use client'

import { Menubar } from "@/Components/Menubar"
import { Footer } from "@/Components/Footer"
import { motion } from "framer-motion"
import { Sparkles } from "lucide-react"
import { Head } from '@inertiajs/react'

const defaultEmbedUrl = 'https://calendar.google.com/calendar/appointments/schedules/AcZssZ2WP1vzheZr36_dTSwJ5V6xIrm3bxGnItNcqTCzLxpya9p-yA_mH6uSaKhGA98iTicoYyAoNL7n?gv=true'
const embedUrl = import.meta.env.VITE_BOOKING_EMBED_URL?.trim() || defaultEmbedUrl

export default function Book() {
  return (
    <>
      <Head>
        <title>Book a Consultation | Cloud & DevOps Expert - Harun R. Rayhan</title>
        <meta name="description" content="Book a 30-minute consultation to discuss cloud architecture, DevOps, or infrastructure automation. Powered by Google Calendar appointment schedules." />
        <meta name="keywords" content="book consultation, cloud consulting, DevOps consulting, technical consultation, AWS expert consultation, Google Calendar appointment schedules" />
        <meta property="og:title" content="Book a Consultation | Cloud & DevOps Expert - Harun R. Rayhan" />
        <meta property="og:description" content="Book a 30-minute consultation to discuss cloud architecture, DevOps, or infrastructure automation. Powered by Google Calendar appointment schedules." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={window.location.href} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Book a Consultation | Cloud & DevOps Expert - Harun R. Rayhan" />
        <meta name="twitter:description" content="Book a 30-minute consultation to discuss cloud architecture, DevOps, or infrastructure automation. Powered by Google Calendar appointment schedules." />
        <link rel="canonical" href={window.location.href} />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Service",
            "name": "Cloud & DevOps Consultation",
            "description": "30-minute consultation session for cloud architecture and DevOps solutions",
            "provider": {
              "@type": "Person",
              "name": "Harun R. Rayhan",
              "jobTitle": "Cloud & DevOps Expert"
            },
            "serviceType": "Professional Consultation",
            "offers": {
              "@type": "Offer",
              "description": "Bookable consultation session",
              "availability": "http://schema.org/InStock"
            }
          })}
        </script>
      </Head>
      <div className="flex flex-col min-h-screen bg-slate-50">
        <div className="relative z-50">
          <Menubar />
        </div>

        <main className="flex-1">
          {/* Hero */}
          <section className="relative overflow-hidden border-b border-slate-200/80 bg-white">
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute left-1/2 top-0 h-[30rem] w-[30rem] -translate-x-1/2 rounded-full bg-blue-100/45 blur-3xl" />
              <div className="absolute right-0 top-24 h-64 w-64 rounded-full bg-sky-100/50 blur-3xl" />
            </div>
            <div className="container relative mx-auto px-4 py-20 sm:py-24 lg:py-28">
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: 'easeOut' }}
                className="mx-auto max-w-3xl text-center"
              >
                <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 shadow-sm">
                  <Sparkles className="h-3.5 w-3.5 text-blue-600" />
                  Google Calendar appointment schedule
                </div>
                <h1 className="mt-6 text-4xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-5xl lg:text-6xl">
                  Schedule a Consultation
                </h1>
                <p className="mt-5 mx-auto max-w-xl text-lg leading-8 text-slate-600">
                  Pick an available time slot below and you'll get a confirmation instantly.
                </p>
              </motion.div>
            </div>
          </section>

          {/* Booking embed — full width */}
          <section className="py-20 sm:py-24">
            <div className="container mx-auto px-4">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="mx-auto max-w-5xl"
              >
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
                  <iframe
                    src={embedUrl}
                    style={{ border: 0 }}
                    width="100%"
                    height="650"
                    frameBorder="0"
                    loading="lazy"
                    title="Google Calendar appointment schedule"
                  />
                </div>
              </motion.div>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  )
}
