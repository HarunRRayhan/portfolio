import { Head } from '@inertiajs/react'
import { motion } from 'framer-motion'
import { Menubar } from '@/Components/Menubar'
import { Footer } from '@/Components/Footer'
import { Container } from '@/Components/ui/container'
import { Shield } from 'lucide-react'
import { getImageUrl } from "@/lib/imageUtils"

export default function Privacy() {
  return (
    <>
      <Head>
        <title>Privacy Policy | Harun's Portfolio</title>
        <meta name="description" content="Privacy policy and data protection information for Harun's Portfolio website and services." />
        <meta name="keywords" content="privacy policy, data protection, GDPR, privacy rights" />
        
        {/* OpenGraph Tags */}
        <meta property="og:title" content="Privacy Policy | Harun's Portfolio" />
        <meta property="og:description" content="Privacy policy and data protection information for Harun's Portfolio website and services." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={window.location.href} />
        
        {/* Twitter Card Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Privacy Policy | Harun's Portfolio" />
        <meta name="twitter:description" content="Privacy policy and data protection information for Harun's Portfolio website and services." />
        
        {/* Canonical URL */}
        <link rel="canonical" href={window.location.href} />

        {/* JSON-LD Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": "Privacy Policy",
            "description": "Privacy policy and data protection information for Harun's Portfolio website and services.",
            "publisher": {
              "@type": "Person",
              "name": "Harun"
            }
          })}
        </script>
      </Head>
      <main className="flex flex-col min-h-screen">
        <Menubar />
        <section className="py-24 bg-gradient-to-br from-[#86D2F1] via-[#7C3AED] to-[#8B5CF6]">
          <div className="container mx-auto px-4 text-center">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="w-16 h-16 rounded-lg bg-white/10 flex items-center justify-center mx-auto mb-6"
            >
              <Shield className="w-8 h-8 text-white" />
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl md:text-5xl font-bold text-white mb-6"
            >
              Privacy Policy
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-xl text-white/90 max-w-3xl mx-auto"
            >
              Your privacy is important to us. Learn how we protect and manage your data.
            </motion.p>
          </div>
        </section>

        <section className="py-24 bg-white">
          <Container>
            <div className="max-w-3xl mx-auto prose prose-lg">
              <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>

              <h2>1. Introduction</h2>
              <p>
                Welcome to Harun's Portfolio. I respect your privacy and am committed to protecting your personal data. 
                This privacy policy will inform you about how I look after your personal data when you visit my website 
                and tell you about your privacy rights.
              </p>

              <h2>2. Data Collection</h2>
              <p>
                I collect and process the following data about you:
              </p>
              <ul>
                <li>Information you provide when you contact me through the website</li>
                <li>Technical data including IP address, browser type and version, time zone setting, browser plug-in types and versions</li>
                <li>Usage data including information about how you use my website</li>
              </ul>

              <h2>3. How I Use Your Data</h2>
              <p>
                I use your data to:
              </p>
              <ul>
                <li>Provide and maintain my website</li>
                <li>Respond to your inquiries and provide support</li>
                <li>Improve my website and services</li>
                <li>Communicate with you about my services</li>
              </ul>

              <h2>4. Data Security</h2>
              <p>
                I have implemented appropriate security measures to prevent your personal data from being accidentally lost, 
                used, or accessed in an unauthorized way. I limit access to your personal data to those who have a business 
                need to know.
              </p>

              <h2>5. Your Legal Rights</h2>
              <p>
                Under certain circumstances, you have rights under data protection laws in relation to your personal data, 
                including the right to:
              </p>
              <ul>
                <li>Request access to your personal data</li>
                <li>Request correction of your personal data</li>
                <li>Request erasure of your personal data</li>
                <li>Object to processing of your personal data</li>
                <li>Request restriction of processing your personal data</li>
                <li>Request transfer of your personal data</li>
                <li>Right to withdraw consent</li>
              </ul>

              <h2>6. Contact Me</h2>
              <p>
                If you have any questions about this privacy policy or my privacy practices, please contact me at:
              </p>
              <p>
                Email: <a href="mailto:me@harun.dev" className="text-primary hover:underline">me@harun.dev</a>
              </p>
            </div>
          </Container>
        </section>

        <Footer />
      </main>
    </>
  )
} 