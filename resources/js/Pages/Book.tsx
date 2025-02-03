'use client'

import { Menubar } from "@/Components/Menubar"
import { Footer } from "@/Components/Footer"
import { motion } from "framer-motion"
import { Calendar } from "lucide-react"
import { Button } from "@/Components/ui/button"
import { Card, CardContent } from "@/Components/ui/card"
import { Link, Head } from '@inertiajs/react'

export default function Book() {
  return (
    <>
      <Head>
        <title>Book a Consultation | Cloud & DevOps Expert - Harun R. Rayhan</title>
        <meta name="description" content="Schedule a 30-minute consultation to discuss your cloud architecture, DevOps, or infrastructure automation needs. Let's explore how we can transform your business together." />
        <meta name="keywords" content="book consultation, cloud consulting, DevOps consulting, technical consultation, AWS expert consultation" />
        
        {/* OpenGraph Tags */}
        <meta property="og:title" content="Book a Consultation | Cloud & DevOps Expert - Harun R. Rayhan" />
        <meta property="og:description" content="Schedule a 30-minute consultation to discuss your cloud architecture, DevOps, or infrastructure automation needs. Let's explore how we can transform your business together." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={window.location.href} />
        
        {/* Twitter Card Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Book a Consultation | Cloud & DevOps Expert - Harun R. Rayhan" />
        <meta name="twitter:description" content="Schedule a 30-minute consultation to discuss your cloud architecture, DevOps, or infrastructure automation needs. Let's explore how we can transform your business together." />
        
        {/* Canonical URL */}
        <link rel="canonical" href={window.location.href} />

        {/* JSON-LD Structured Data */}
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
              "description": "Free 30-minute consultation session",
              "availability": "http://schema.org/ComingSoon"
            }
          })}
        </script>
      </Head>
      <div className="flex flex-col min-h-screen relative">
        <div className="fixed top-0 left-0 right-0 z-50">
          <Menubar />
        </div>
        <main className="flex-1">
          {/* Hero Section */}
          <section className="min-h-[400px] bg-gradient-to-br from-[#86D2F1] via-[#7C3AED] to-[#8B5CF6] flex items-center">
            <div className="container mx-auto px-4 py-20">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="text-center max-w-3xl mx-auto"
              >
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Schedule a Consultation</h1>
                <p className="text-xl text-white/80">
                  Book a 30-minute session to discuss your project needs and explore how we can work together to achieve
                  your goals.
                </p>
              </motion.div>
            </div>
          </section>

          {/* Calendar Section */}
          <section className="py-32 bg-gray-50 flex-grow">
            <div className="container mx-auto px-4">
              <Card className="max-w-2xl mx-auto shadow-lg">
                <CardContent className="p-8">
                  <div className="text-center space-y-6">
                    <Calendar className="w-16 h-16 mx-auto text-[#7C3AED]" />
                    <h2 className="text-2xl font-semibold text-gray-800">Calendar Integration Coming Soon</h2>
                    <p className="text-gray-600">
                      We're currently setting up our booking system. For immediate assistance, please reach out via email.
                    </p>
                    <Button className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white">
                      <a href="mailto:hello@harun.dev" className="text-white no-underline">Contact via Email</a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>
        </main>
        <Footer />
      </div>
    </>
  )
} 