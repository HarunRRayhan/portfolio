'use client'

import { Menubar } from "@/Components/Menubar"
import { Footer } from "@/Components/Footer"
import { motion } from "framer-motion"
import { Calendar, ExternalLink, Mail, Sparkles } from "lucide-react"
import { Button } from "@/Components/ui/button"
import { Card, CardContent } from "@/Components/ui/card"
import { Head } from '@inertiajs/react'

const defaultBookingUrl = 'https://calendar.app.google/udfiL5QMDefg7SiD6'
const bookingUrl = import.meta.env.VITE_BOOKING_URL?.trim() || defaultBookingUrl
const hasBookingUrl = bookingUrl.length > 0

const features = [
  'Google Calendar availability checks',
  'Booking windows, buffers, and notice controls',
  'Confirmation and calendar hold',
]

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
                  Book a 30-minute session to discuss your project needs and explore how we can work together
                  to achieve your goals.
                </p>
              </motion.div>
            </div>
          </section>

          {/* Booking section */}
          <section className="py-20 sm:py-24">
            <div className="container mx-auto px-4">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="mx-auto max-w-4xl"
              >
                <Card className="overflow-hidden border-slate-200 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
                  <CardContent className="p-0">
                    <div className="grid md:grid-cols-5">
                      {/* Left: main content */}
                      <div className="col-span-3 space-y-6 bg-white p-8 sm:p-10">
                        <div className="space-y-2">
                          <h2 className="text-2xl font-semibold tracking-[-0.03em] text-slate-950">
                            Pick a time that works for you
                          </h2>
                          <p className="leading-7 text-slate-600">
                            This booking page points to a Google Calendar appointment schedule. It checks
                            availability, hides busy slots, and lets you book directly — no custom scheduler
                            needed.
                          </p>
                        </div>

                        <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                          <p className="text-sm font-semibold text-slate-900">What you get</p>
                          <ul className="space-y-2">
                            {features.map((f) => (
                              <li key={f} className="flex items-start gap-3 text-sm text-slate-600">
                                <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                                <span>{f}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row">
                          {hasBookingUrl ? (
                            <Button
                              asChild
                              size="lg"
                              className="group w-full rounded-full bg-slate-950 px-6 text-white shadow-none transition hover:-translate-y-0.5 hover:bg-slate-800 sm:w-auto"
                            >
                              <a href={bookingUrl} target="_blank" rel="noreferrer">
                                Open booking page
                                <ExternalLink className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                              </a>
                            </Button>
                          ) : null}

                          <Button
                            asChild
                            size="lg"
                            variant="outline"
                            className="w-full rounded-full border-slate-200 bg-white px-6 text-slate-900 shadow-none hover:border-slate-300 hover:bg-slate-50 sm:w-auto"
                          >
                            <a href="mailto:me@harun.dev">
                              <Mail className="mr-2 h-4 w-4" />
                              Contact via email
                            </a>
                          </Button>
                        </div>
                      </div>

                      {/* Right: how it works panel */}
                      <div className="col-span-2 bg-slate-950 p-8 text-white sm:p-10">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                          How it works
                        </p>
                        <div className="mt-6 space-y-6">
                          {[
                            { step: '1', text: 'Open the Google Calendar appointment schedule link.' },
                            { step: '2', text: 'Choose an available time slot that fits your schedule.' },
                            { step: '3', text: 'You get a confirmation and I get a clean calendar hold.' },
                          ].map(({ step, text }) => (
                            <div key={step} className="flex gap-4">
                              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-semibold">
                                {step}
                              </span>
                              <p className="text-sm leading-6 text-slate-300">{text}</p>
                            </div>
                          ))}
                        </div>
                        <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-5">
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Fallback</p>
                          <p className="mt-2 text-sm leading-6 text-slate-300">
                            If the booking page is unavailable, reach out via email and I can send a direct
                            calendar invitation.
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  )
}
