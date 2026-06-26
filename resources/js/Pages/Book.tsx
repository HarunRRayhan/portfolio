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
              "price": "0",
              "priceCurrency": "USD",
              "description": "Free initial consultation"
            }
          })}
        </script>
      </Head>

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-slate-200 bg-slate-50">
        <div className="container mx-auto px-4 py-20 sm:py-24 lg:py-28">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white/80 px-3 py-1.5 shadow-sm">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Book a Session
              </span>
            </div>
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            >
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
                Let&rsquo;s talk about your next project.
              </h1>
              <p className="mt-4 text-lg leading-7 text-slate-500">
                Book a 30-minute consultation. No pitch, no pressure — just a conversation about what you&rsquo;re building and how I can help.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Calendar embed */}
      <section className="bg-white py-16 sm:py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="mx-auto max-w-4xl overflow-hidden rounded-xl border border-slate-200 shadow-sm"
          >
            <iframe
              src={embedUrl}
              title="Book a consultation"
              className="h-[600px] w-full sm:h-[700px]"
              frameBorder="0"
            />
          </motion.div>
        </div>
      </section>
    </>
  )
}
